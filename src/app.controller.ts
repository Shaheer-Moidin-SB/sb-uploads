import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_UPLOADS_TOPIC } from './utils/constants/kafka-const';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern(KAFKA_UPLOADS_TOPIC.upload_files)
  async uploadFiles(@Payload() payload: any) {
    const { files, folder } = payload;

    const isArray = Array.isArray(files);
    const filesUploadPromises = [];

    if (isArray) {
      for (const imageFile of files) {
        // Push the promise directly
        const uploadPromise = this.appService.uploadFile(imageFile, folder);
        filesUploadPromises.push(uploadPromise);
      }
    } else {
      const uploadPromise = this.appService.uploadFile(files.images, folder);
      filesUploadPromises.push(uploadPromise);
    }

    // Await all promises to resolve and gather the results
    const uploadedFiles = await Promise.all(filesUploadPromises);

    // Now return the URLs for saving in MongoDB in sb-properties
    return {
      filesUrls: uploadedFiles, // Ensure you return the resolved URLs
    };
  }
}
