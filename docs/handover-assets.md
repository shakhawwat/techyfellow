# Public asset handover review

Reviewed 2026-10-09 (Asia/Dhaka). Inventory is limited to files retained in the ZIP.

The original public directory has 27 files. Retained: 24 banner JPEGs, one brand JPEG
(`icon_logo.jpeg`) and one brand MP4 (`logo.mp4`), 26 files total. All retained bytes are
unchanged. There are no symlinks, real environment files, credential files, user-upload
folders, database dumps or other documents among those retained public assets.

**Excluded unintended file:** `brand/logo.jpeg` is a Microsoft Word/Office ZIP document,
not a JPEG. It has 18 Office container entries and document text. No UI reference was found.
Its contents are not included or reproduced here. It is excluded only from the source package;
the working local copy was deliberately not altered. Remove/quarantine it before public launch.

All 25 genuine JPEGs decoded; a thumbnail contact sheet of all images was visually inspected.
Images show branding, illustrative electronics/research/education/team artwork and two supplied
portrait photographs. No confidential-document imagery was observed at review scale. No EXIF
tags or unexpected image comment/XMP metadata were detected. This is not an image-forensics or
identity/ownership certification. Portrait subjects must not be represented as the fictional
team names without verified consent and identity approval.

The public logo MP4 decoded in installed Chrome; frames at 10%, 50% and 90% were visually
inspected and show the brand animation. No common MP4 GPS/location metadata markers were
found. Full video/audio/transcript inspection is NOT RUN; licenses/consent for every supplied
asset are NOT RUN and require client confirmation. Source code retains the video and icon
fallback used by navbar; the excluded document is not its image fallback.

`banner/idea2.jpg` has 92,220,000 pixels and triggered Pillow's large-image warning. Review
performance and approve optimized derivatives separately; no image/UI edits were made.

| Path below frontend/public | Observed type / review | Bytes | SHA-256 |
| --- | --- | --- | --- |
| `banner/PP.jpg` | JPEG 4912×7360; no EXIF tags | 9319361 | `189daa891ac2c248126dae5ada5337b9bc8f9806ed56bbf3ae7f6463fa47cfd2` |
| `banner/PP2.jpg` | JPEG 4000×6000; no EXIF tags | 2862250 | `eff8b0037a9e0c6486623de373120494083e5b09cb1dd0b8cb5257ec2db0e82b` |
| `banner/TEAM.jpg` | JPEG 5040×3360; no EXIF tags | 3948877 | `f406eb40816a404536c040e07618216fba20a5f8ab6f6b49bca8421d466c4e71` |
| `banner/TEAM1.jpg` | JPEG 6000×4000; no EXIF tags | 2776263 | `876d51104dc7c93e754e130fb961dc9bda904e96b17b53e6741de3d3fd28cd4b` |
| `banner/academy.jpg` | JPEG 5184×3456; no EXIF tags | 1932415 | `6c29a46454e4b1d0f45faa826b6a95d324bc7de69585938cf592bb68ce22dcc6` |
| `banner/academy_2.jpg` | JPEG 4592×3448; no EXIF tags | 1951699 | `4f426034a152e418440157d0a13a0b2d6f4ee8cd5fe8a0e7e24cc2a5ed7f5a3f` |
| `banner/ai_banner.jpg` | JPEG 6240×3510; no EXIF tags | 1245114 | `e3f863ff2aeeba2ffcf218291a55db098debf41ed20d9e7ebae7c023ca9190f6` |
| `banner/aibanner3.jpg` | JPEG 5120×2880; no EXIF tags | 1084723 | `c58476c2bcabb925bf1d78567c5ebf5125d9e1c171e01d3cf02c073b66131fbc` |
| `banner/b1.jpg` | JPEG 2400×1713; no EXIF tags | 740622 | `c577367a7f801fd7ac4a1888f0090a6fd0a2fbedd737aeb9550a6dd8d7296e8e` |
| `banner/b2.jpg` | JPEG 5120×2880; no EXIF tags | 1477679 | `af4151e46a3fc3b9d246ac4fa6ee24b45415a373407218cda2b740970ee8bde8` |
| `banner/b3.jpg` | JPEG 4069×2160; no EXIF tags | 908886 | `2ef1c7f7e4a3cf61584a526f1e08cb551e9553b0ab286c42a9423d70fab3a086` |
| `banner/banner_1.jpg` | JPEG 4000×3003; no EXIF tags | 1250906 | `70695995dcaa35e7c0980b682395be76d6e217d840d13fc806c25d9f8a51426f` |
| `banner/banner_2.jpg` | JPEG 2600×2600; no EXIF tags | 582521 | `ee51eb6e6b25a6299646ae601ad70346bfc16c3598a4bdf4fcbaaf32754d9b2e` |
| `banner/banner_3.jpg` | JPEG 5120×2880; no EXIF tags | 1477679 | `af4151e46a3fc3b9d246ac4fa6ee24b45415a373407218cda2b740970ee8bde8` |
| `banner/consultin2.jpg` | JPEG 3013×3647; no EXIF tags | 783724 | `f710f6f47c3976c67ed69eddd1ff1d6c3f32bde707e79857bdf31c32f5335354` |
| `banner/consulting.jpg` | JPEG 5184×3456; no EXIF tags | 1100794 | `5cf9694d07ce880d25d27ad5ee3840f8e805692507ea0554bb75f2c08ab297a3` |
| `banner/esp32Bannetr.jpg` | JPEG 5589×3145; no EXIF tags | 1931226 | `d8d5441f394d759c616176fa4e2fe69e1763ddb7c8b748dbb444dcbee1fa86a9` |
| `banner/handBanner.jpg` | JPEG 7680×4320; no EXIF tags | 8768230 | `54220a70fa0c280709813b11bf8beb5e3616a2f54ad35c67bffb4bbc49ad989f` |
| `banner/idea.jpg` | JPEG 3000×2001; no EXIF tags | 397447 | `c57ca3ab51a20ecdbde89345943c9cd6019fa2c3f742db68615b6deb17c26e29` |
| `banner/idea2.jpg` | JPEG 12000×7685; no EXIF tags | 1018156 | `312189b76894e71be899e06013f3a9ed43f496343b8467f889ba186ee1a94bb3` |
| `banner/iot_banner.jpg` | JPEG 6000×4000; no EXIF tags | 3040494 | `bf56789d8c77e0309b146ada3c8e3b8fdd8e519bbfed845423a2470974f83da6` |
| `banner/loginBanner.jpg` | JPEG 5184×3456; no EXIF tags | 2068532 | `2db0394173b75cd85a853e4429d5ecb29197ca503c88a0b6600cb6c4d26ed7d2` |
| `banner/publications.jpg` | JPEG 7952×5304; no EXIF tags | 4798812 | `62c233732e7ba1573de29aefd32468fd119c47986d438f4637807d816c0bd056` |
| `banner/reserach.jpg` | JPEG 7952×5304; no EXIF tags | 7476251 | `a598fd3daca7ad8ff5b74d9be0aa942f99bedc1517480e679473dead9250e68b` |
| `brand/icon_logo.jpeg` | JPEG 1303×1207; no EXIF tags | 29142 | `7842da74808407e0089ceddbebad3a3c35703408f8055909f95c620ec6d4e211` |
| `brand/logo.mp4` | MP4; decoded 368×368, 4.111563s; 3 frames inspected | 192998 | `bcb5cc20c30862a1a9db99433d28bfd5faf89a913ba1154fdce651f723394548` |
