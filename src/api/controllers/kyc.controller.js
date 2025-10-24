const sumsubService = require("../services/sumsub.service");
const crmService = require("../services/crm.service");
const webhookPayloadCache = new Map();
const kycStatusCache = new Map();

exports.generateSumsubToken = async (req, res) => {
  try {
    if (!req.user || !req.user.user) {
      console.error(
        "Authentication middleware did not attach user ID to the request."
      );
      return res
        .status(401)
        .json({ message: "Unauthorized: Authentication data is missing." });
    }

    const userId = req.user.user;
    console.log(
      `Request received to generate Sumsub token for userId: ${userId}`
    );
    const accessToken = await sumsubService.createAccessToken(userId);

    res.status(200).json({
      message: "Sumsub token generated successfully",
      token: accessToken,
    });
  } catch (error) {
    console.error("Error in generateSumsubToken:", error.message);
    res
      .status(500)
      .json({ message: "Server error while generating Sumsub token" });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    console.log("Sumsub webhook received:", JSON.stringify(req.body, null, 2));

    const { externalUserId, reviewResult, reviewStatus } = req.body;

    if (!externalUserId) {
      return res.status(200).send("Webhook processed (no user ID).");
    }

    webhookPayloadCache.set(externalUserId, req.body);
    setTimeout(() => webhookPayloadCache.delete(externalUserId), 5 * 60 * 1000);

    if (
      reviewResult?.reviewAnswer === "GREEN" &&
      reviewStatus === "completed"
    ) {
      console.log(
        `KYC approved for user [${externalUserId}]. Caching status for frontend polling.`
      );
      kycStatusCache.set(externalUserId, {
        status: "completed",
        result: "GREEN",
      });
      setTimeout(() => kycStatusCache.delete(externalUserId), 5 * 60 * 1000);
    }
    res.status(200).send("Webhook processed and cached successfully.");
  } catch (error) {
    console.error(
      `Failed to cache webhook for user [${req.body.externalUserId}]:`,
      error.message
    );
    res.status(500).json({ message: "Server error while handling webhook" });
  }
};

exports.getKycStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.user || !req.user.token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Authentication data is missing." });
    }

    const userId = req.user.user;
    const userCrmToken = req.user.token;
    const kycStatus = kycStatusCache.get(userId);

    if (kycStatus && kycStatus.status === "completed") {
      const webhookPayload = webhookPayloadCache.get(userId);

      if (webhookPayload) {
        console.log(
          `User [${userId}] has a completed KYC status. Processing CRM update now.`
        );
        const {
          applicantId,
          inspectionId,
          applicantType,
          levelName,
          type,
          reviewResult,
          reviewStatus,
        } = webhookPayload;

        const answers = [
          { eqaq_id: "155", eqaa_text: applicantId },
          { eqaq_id: "156", eqaa_text: inspectionId },
          { eqaq_id: "157", eqaa_text: applicantType },
          { eqaq_id: "158", eqaa_text: levelName },
          { eqaq_id: "159", eqaa_text: type },
          { eqaq_id: "160", eqaa_text: reviewResult?.reviewAnswer || "" },
          { eqaq_id: "161", eqaa_text: reviewStatus },
        ];

        await crmService.setQuestionnaireAnswers(userId, userCrmToken, answers);

        console.log(
          `Successfully updated CRM for user [${userId}] after status poll.`
        );

        kycStatusCache.delete(userId);
        webhookPayloadCache.delete(userId);

        return res.status(200).json({ success: true, ...kycStatus });
      }
    }

    return res.status(200).json({ success: true, status: "pending" });
  } catch (error) {
    console.error("Error in getKycStatus:", error.message);
    res.status(500).json({ message: "Server error while checking KYC status" });
  }
};
