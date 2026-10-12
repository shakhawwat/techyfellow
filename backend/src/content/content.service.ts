import { MediaService } from "../media/media.service";
import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { ContentKind, ContentRecord, PublicListDto } from "./content.types";
import { slugPattern } from "./content.schemas";
import { parsePublicQuery } from "./public-query";
import { publicProjection, toPublicDto } from "./public-dto";

@Injectable()
export class ContentService {
  constructor(
    private readonly media: MediaService,
    @InjectModel("Project") private readonly projects: Model<ContentRecord>,
    @InjectModel("ResearchProject") private readonly research: Model<ContentRecord>,
    @InjectModel("Publication") private readonly publications: Model<ContentRecord>,
    @InjectModel("TeamMember") private readonly team: Model<ContentRecord>,
    @InjectModel("Course") private readonly courses: Model<ContentRecord>,
  ) {}
  private model(kind: ContentKind) { return this[kind]; }

  async list(kind: ContentKind, raw: Record<string, unknown>): Promise<PublicListDto> {
    const { page, limit, skip, sort, filter } = parsePublicQuery(kind, raw);
    const model = this.model(kind);
    try {
      const [records, total] = await Promise.all([
        model.find(filter).select(publicProjection(kind)).sort(sort).skip(skip).limit(limit).maxTimeMS(1500).lean<ContentRecord[]>().exec(),
        model.countDocuments(filter).maxTimeMS(1500).exec(),
      ]);
      return { data: await Promise.all(records.map(async record => { const dto = toPublicDto(kind, record); if (kind === "projects" && "media" in dto) dto.media = await this.media.publicImages(record.media); return dto; })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } catch {
      throw new ServiceUnavailableException();
    }
  }

  async detail(kind: ContentKind, slug: string, query: Record<string, unknown>) {
    if (Object.keys(query).length) throw new BadRequestException();
    if (slug.length > 160 || !slugPattern.test(slug)) throw new NotFoundException();
    let record: ContentRecord | null;
    try {
      record = await this.model(kind).findOne({ slug, status: "published", publishedAt: { $lte: new Date() } })
        .select(publicProjection(kind)).maxTimeMS(1500).lean<ContentRecord>().exec();
    } catch {
      throw new ServiceUnavailableException();
    }
    if (!record) throw new NotFoundException();
    const dto = toPublicDto(kind, record);
    if (kind === "projects" && "media" in dto) { try { dto.media = await this.media.publicImages(record.media); } catch { throw new ServiceUnavailableException(); } }
    return { data: dto };
  }
}
