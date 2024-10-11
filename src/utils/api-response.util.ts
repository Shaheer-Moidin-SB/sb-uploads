export interface ApiResponseInterface {
  message?: string;
  status?: boolean;
  data?: any;
}

class ApiResponse {
  private message: string;
  private status: boolean;
  private data?: any;

  constructor(data: any, message = 'Ok') {
    this.message = message;
    this.status = true;
    this.data = data;

    this.formattedData();
  }

  private formattedData() {
    return {
      status: this.status,
      message: this.message,
      data: this.data,
    };
  }
}

export default ApiResponse;
