const postFormatInterceptors = []

module.exports = {
  _postFormatInterceptors: postFormatInterceptors,
  addPostFormatInterceptor: postFormatInterceptor => {
    postFormatInterceptors.push(postFormatInterceptor)
  }
}
