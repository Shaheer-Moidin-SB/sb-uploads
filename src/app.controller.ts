import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_UPLOADS_TOPIC } from './utils/constants/kafka-const';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  //check the optimization and speed.Keep working on the code quality.
  @MessagePattern(KAFKA_UPLOADS_TOPIC.upload_files)
  async uploadFiles(@Payload() payload: any) {
    console.log('uploadFiles called with payload:');
    const { files, module } = payload;

    // Ensure files is an array for consistency
    const fileArray = Array.isArray(files) ? files : [files.images];

    // Upload files and gather results
    const uploadedFiles = await Promise.all(
      fileArray.map((file) => this.appService.uploadFile(file, module)),
    );

    // Destructure the results into separate arrays
    const filesUrls = uploadedFiles.map((file) => file.publicUrl);
    const metadata = uploadedFiles.map((file) => file.metadata);

    // Return the result with both URLs and metadata
    return {
      filesUrls,
      metadata,
    };
  }
}
