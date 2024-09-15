class apiFunctionality {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const search = this.queryStr.search
      ? {
          name: {
            $regex: this.queryStr.search,
            $options: "i",
          },
        }
      : {};

    this.query = this.query.find({ ...search });
    return this;
  }

  filter() {
    const query = { ...this.queryStr };
     
     const removeQueryFields = ["search", "page", "limit"];
     removeQueryFields.map((key) => delete query[key]);
     
     let queryString = JSON.stringify(query);
     queryString = queryString.replace(
       /\b(gt|gte|lt|lte)\b/g,
       (key) => `$${key}`
      );

    this.query = this.query.find(JSON.parse(queryString));
    return this;
  }

  pagination(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;

    const skip = resultPerPage * (currentPage - 1);
    this.query = this.query.limit(resultPerPage).skip(skip);

    return this;
  }
}

export default apiFunctionality;
