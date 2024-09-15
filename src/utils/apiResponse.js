class apiResponse {
  constructor(statusCode, message = "success", data, count = null) {
    (this.statusCode = statusCode),
      (this.message = message),
      (this.data = data),
      (this.success = statusCode < 400);
    this.count = count;
  }
}


export {apiResponse}