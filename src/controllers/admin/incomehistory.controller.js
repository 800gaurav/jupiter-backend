import { UserModel } from "../../models/user.model.js";

const incomehistoryController = {

  roihistory: async (req, res) => {
    try {
      // Fetch all users with roiIncomeHistory
      const users = await UserModel.find({ 'roiIncomeHistory.0': { $exists: true } })
        .select('userId name roiIncomeHistory')
        .lean();

      // Flatten ROI income history across users
      const allROIIncomeHistory = users.flatMap(user =>
        user.roiIncomeHistory.map(entry => ({
          userId: user.userId,
          name: user.name,
          amount: entry.amount,
          date: entry.date,
        }))
      );

      res.status(200).json({
        success: true,
        message: "All ROI income history fetched successfully",
        data: allROIIncomeHistory,
      });
    } catch (error) {
      console.error("Error fetching ROI income history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch ROI income history",
      });

    }
  },

  proBonusHistory: async (req, res) => {
    try {
      // Fetch all users who have any proBonusHistory
      const users = await UserModel.find({ 'proBonusHistory.0': { $exists: true } })
        .select('userId name proBonusHistory') // Only select what's needed
        .lean();

      // Flatten all proBonusHistory into a single array
      const allProBonusHistory = users.flatMap(user =>
        user.proBonusHistory.map(entry => ({
          userId: user.userId,
          name: user.name,
          fromUser: entry.fromUser,
          baseAmount: entry.baseAmount,
          amount: entry.amount,
          date: entry.date,
        }))
      );

      res.status(200).json({
        success: true,
        message: "All pro bonus history fetched successfully",
        data: allProBonusHistory,
      });
    } catch (error) {
      console.error("Error fetching pro bonus history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch pro bonus history",
      });
    }

  },

  getAllRoyaltyIncomeHistory: async (req, res) => {
    try {
      const users = await UserModel.find({ 'royaltyHistory.0': { $exists: true } })
        .select('userId name royaltyHistory')
        .lean();

      const allRoyaltyHistory = users.flatMap(user =>
        user.royaltyHistory.map(entry => ({
          userId: user.userId,
          name: user.name,
          business: entry.business,
          strongLeg: entry.strongLeg,
          otherLeg: entry.otherLeg,
          reward: entry.reward,
          date: entry.date,
        }))
      );

      res.status(200).json({
        success: true,
        message: "Royalty income history fetched successfully",
        data: allRoyaltyHistory,
      });
    } catch (error) {
      console.error("Error fetching royalty income history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch royalty income history",
      });
    }
  },
  getDomesticIncomeHistory: async (req, res) => {
    try {
      const users = await UserModel.find({}, 'userId name domesticIncomeDetails');

      // Initialize levels array 1–20
      const levelWiseData = Array.from({ length: 20 }, (_, i) => ({
        level: i + 1,
        totalIncome: 0,
        users: []
      }));

      for (const user of users) {
        const levelMap = new Map();

        for (const record of user.domesticIncomeDetails || []) {
          const level = record.level;
          const income = record.income || 0;

          if (!level || level < 1 || level > 20) continue;

          // Accumulate user income per level
          const previous = levelMap.get(level) || 0;
          levelMap.set(level, previous + income);

          // Add to level total
          levelWiseData[level - 1].totalIncome += income;
        }

        // Push user data to respective level
        for (const [level, income] of levelMap.entries()) {
          levelWiseData[level - 1].users.push({
            userId: user.userId,
            username: user.name,
            income
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: levelWiseData
      });

    } catch (err) {
      console.error("Domestic income aggregation error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },

  getUserNetwork: async (req, res) => {
    try {
      const { userId } = req.params;

      // Sabse pehle us user ka _id nikal lo
      const rootUser = await UserModel.findOne({ userId }).select("_id userId");
      if (!rootUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const levels = {};
      let currentLevelUsers = [rootUser._id]; // yaha ab ObjectId ka array hoga

      for (let level = 1; level <= 20; level++) {
        const users = await UserModel.find({ referrer: { $in: currentLevelUsers } })
          .select("_id email userId referrer");

        if (users.length === 0) break;

        levels[`level_${level}`] = {
          count: users.length,
          users: users.map(u => ({
            _id: u._id,
            email: u.email,
            userId: u.userId,
          })),
        };

        // next level ke liye inke ObjectIds lenge
        currentLevelUsers = users.map(u => u._id);
      }

      return res.json({
        success: true,
        message: "User network fetched",
        data: levels,
      });
    } catch (error) {
      console.error("❌ Network Error:", error);
      res.status(500).json({ message: error.message });
    }
  },

};

export { incomehistoryController }