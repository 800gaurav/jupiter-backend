import { UserModel } from "../models/user.model.js";

const buildTree = async (userId) => {
  const user = await UserModel.findById(userId).lean();
  if (!user || user.level > 18) return null;

  const left = user.leftChild ? await buildTree(user.leftChild) : null;
  const right = user.rightChild ? await buildTree(user.rightChild) : null;

  return {
    level: user.binaryLevel,
    name: user.name,
    email: user.email,
    leftChild: left,
    rightChild: right,
  };
}

export { buildTree }