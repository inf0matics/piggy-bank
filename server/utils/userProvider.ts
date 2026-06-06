export const userProvider: IUserProvider = {
  login(accessKey) {
    return getUserByAccessKey(accessKey)
  },
  getUser(userId: string) {
    return getUserById(userId)
  },
}
