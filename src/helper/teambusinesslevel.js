import { UserModel } from "../models/user.model.js";

// export const getTeamBusinessByLevels = async (rootUserId) => {
// const levelMap = new Map(); // level => list of userIds

//   let queue = [{ userId: rootUserId, level: 0 }];
//   const visited = new Set();

//   while (queue.length) {
//     const {userId, level} = queue.shift();
//     visited.add(userId);

//     const user = await UserModel.findById(userId).select("leftChild rightChild nfts");

//    if (!user) continue;

//    if (!levelMap.has(level)) levelMap.Set(level, []);
//    levelMap.get(level).push(user);

//    if (user.leftChild && !visited.has(user.leftChild.toString())) {
//     queue.push({ userId: user.leftChild.toString(), level: level + 1 });
//    }

//    if (user.rightChild && !visited.has(user.rightChild.toString())) {
//     queue.push({ userId: user.rightChild.toString(), level: level + 1 });
//    }
//   }
//   return levelMap;
// };

export const getTeamBusinessByLevels = async (rootUserId) => {
  const levelMap = new Map(); // level => array of users

  let queue = [{ userId: rootUserId, level: 0 }];
  const visited = new Set();

  while (queue.length) {
    const { userId, level } = queue.shift();
    if (visited.has(userId)) continue;
    visited.add(userId);

    const user = await UserModel.findById(userId).select("leftChild rightChild nfts");
    if (!user) continue;

    if (level > 0) {
      if (!levelMap.has(level)) levelMap.set(level, []);
      levelMap.get(level).push(user);
    }

    if (user.leftChild && !visited.has(user.leftChild.toString())) {
      queue.push({ userId: user.leftChild.toString(), level: level + 1 });
    }

    if (user.rightChild && !visited.has(user.rightChild.toString())) {
      queue.push({ userId: user.rightChild.toString(), level: level + 1 });
    }
  }

  return levelMap;
};
