const { assert } = require('chai');
const { findUserByEmail } = require('../helper.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('findUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedOutput = testUsers["userRandomID"];
    assert.deepEqual(expectedOutput, user);
  });
  it('should return undefined value if no object found based on email ', function() {
    const user = findUserByEmail("user123123@example.com", testUsers);
    const expectedOutput = undefined;
    assert.equal(expectedOutput, user);
  });
});