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

  async uploadFile(files: Express.Multer.File, folder: string) {
    try {
      if (!files || !Buffer.isBuffer(files.buffer)) {
        files.buffer = Buffer.from(files.buffer);
      }
      const bucket = this.storage.bucket(this.bucketName);
      const blob = bucket.file(
        `${folder}/${files.fieldname}/${files.originalname}`,
      );
      const blobStream = blob.createWriteStream({
        resumable: false,
        chunkSize: 10 * 1024 * 1024, // 10MB chunk size
        metadata: { contentType: files.mimetype },
      });

      // Fetch metadata
      const [metadata] = await blob.getMetadata();

      return new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${blob.name}`;
          const respond = {
            publicUrl: publicUrl,
            metadata: metadata,
          };
          resolve(respond);
        });

        blobStream.end(files.buffer);
      });
    } catch (oError) {
      throw new RpcException(oError);
    }
  }
}
