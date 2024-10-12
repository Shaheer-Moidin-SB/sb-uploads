import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AppService {
  private storage: Storage;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const keyFilename = this.configService.get<string>(
      'GOOGLE_CLOUD_BUCKET_KEY_FILE_NAME',
    );
    const projectId = this.configService.get<string>(
      'GOOGLE_CLOUD_BUCKET_PROJECT_ID',
    );

    this.storage = new Storage({
      keyFilename: keyFilename,
      projectId: projectId,
    });

    this.bucketName = this.configService.get<string>(
      'GOOGLE_CLOUD_BUCKET_NAME',
    );
  }

  async uploadFile(files: Express.Multer.File, module: string) {
    try {
      if (!files || !Buffer.isBuffer(files.buffer)) {
        files.buffer = Buffer.from(files.buffer);
      }
      const bucket = this.storage.bucket(this.bucketName);
      const blob = bucket.file(
        `${module}/${files.fieldname}/${files.originalname}`,
      );
      const blobStream = blob.createWriteStream({
        resumable: false,
        chunkSize: 10 * 1024 * 1024, // 10MB chunk size
        metadata: { contentType: files.mimetype },
      });

      let publicUrl = '';
      let metadata = {};

      // Create a new Promise that resolves when the blob stream finishes
      await new Promise<void>(async (resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', resolve);
        blobStream.end(files.buffer);
        // Fetch metadata after upload
        publicUrl = `https://storage.googleapis.com/${this.bucketName}/${blob.name}`;
        const [fileMeta] = await blob.getMetadata();
        const oDocument = {
          documentType: files.fieldname,
          module: module,
          documentFileType: fileMeta.contentType,
          documentUrl: publicUrl,
          fileName: files.originalname,
          size: fileMeta.size,
          //Value to update when there is mongodb collection create/save
          propertyId: null,
          projectId: null,
          floorPlanId: null,
          rentalsId: null,
          developerId: null,
          userId: null,
          uploadedBy: null,
        };

        metadata = oDocument;
      });

      return { publicUrl, metadata };
    } catch (oError) {
      throw new RpcException(oError);
    }
  }
}
