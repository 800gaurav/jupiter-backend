import { UserModel } from "../models/user.model.js";

const countNodes = async (userId) => {
  const user = await UserModel.findById(userId).lean();
  if (!user) return 0;

  let leftCount = 0;
  let rightCount = 0;

  if (user.leftChild) {
    leftCount = await countNodes(user.leftChild);
  }

  if (user.rightChild) {
    rightCount = await countNodes(user.rightChild);
  }

  return leftCount + rightCount;
};

export { countNodes }