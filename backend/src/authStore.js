// Very simple in-memory user "store" for prototyping.
// NOTE: This is NOT persistent. Restarting the server will clear users.

const users = []; // { id, name, email, passwordHash }

export function findUserByEmail(email) {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function addUser(user) {
  users.push(user);
  return user;
}
