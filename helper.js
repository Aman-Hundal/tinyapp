const generateRandomString = function() {
  let shortURL = "";
  let count = 0;
  const encryptionSet = [0,1,2,3,4,5,6,7,8,9, "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
  while (count < 6) {
    let randIndex = Math.floor(Math.random() * (62 - 0) + 0);
    shortURL += encryptionSet[randIndex];
    count++;
  }
  return shortURL;
};
const findUserByEmail = function(userEmail, database) {
  for (let key in database) {
    if (database[key]["email"] === userEmail) {
      return database[key];
    }
  }
  return undefined;
};
const urlsForUser = function(userId, database) {
  let filteredObj = {};
  for (let keys in database) {
    if (userId === database[keys]["userID"]) {
      filteredObj[keys] = database[keys];
    }
  }
  return filteredObj;
};

module.exports = {
  findUserByEmail,
  generateRandomString,
  urlsForUser
};