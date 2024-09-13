class apiResponse {
  constructor(statusCode, message = "success", data, pages = null) {
    (this.statusCode = statusCode),
      (this.message = message),
      (this.data = data),
      (this.success = statusCode < 400);
    this.pages = pages;
  }
}


export {apiResponse}