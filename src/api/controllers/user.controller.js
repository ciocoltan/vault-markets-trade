const crmService = require('../services/crm.service');

/**
 * Controller to submit answers for a questionnaire.
 */
const submitQuestionnaireAnswers = async (req, res) => {
    const { user, token } = req.user;
    const { answers } = req.body; 

    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ success: false, message: 'A valid answers array is required.' });
    }
    
    try {
        const response = await crmService.setQuestionnaireAnswers(user, token, answers);
        res.status(200).json(response);
    } catch (error) {
        console.error('Failed to submit questionnaire answers:', error); 
        if (error.crmError) {
            const statusCode = error.details?.info?.code || 400;
            return res.status(statusCode).json({ success: false, message: error.message });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to submit answers.' });
        }
    }
}

/**
 * Controller to fetch all questionnaires for a user.
 */
const getAllQuestionnaires = async (req, res) => {
  try {
    const { user, token } = req.user;
    const response = await crmService.getQuestionnaire(user, token);
    res.status(200).json(response);
  } catch (error) {
    console.error('Failed to get all questionnaires:', error);
    if (error.crmError) {
        const statusCode = error.details?.info?.code || 400;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to retrieve questionnaires.' });
  }
};

/**
 * Controller to get a user's saved answers for a specific questionnaire.
 */
const getQuestionnaireAnswers = async (req, res) => {
    const { user, token } = req.user;

    try {
        const response = await crmService.getQuestionnaireAnswers(user, token);
        res.status(200).json(response);
    } catch (error) {
        if (error.crmError) {
            return res.status(401).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to retrieve questionnaire answers.' });
    }
};

const getUserProgress = async (req, res) => {
    const { user, token } = req.user;

    try {
        const [
            userAnswersResponse,
            allQuestionnairesResponse,
        ] = await Promise.all([
            crmService.getQuestionnaireAnswers(user, token),
            crmService.getQuestionnaire(user, token, '14'),
        ]);

        res.status(200).json({
            success: true,
            message: 'User progress fetched successfully.',
            user: { id: user },
            userAnswers: userAnswersResponse.data || [],
            questionnaires: allQuestionnairesResponse.data || [],
        });

    } catch (error) {
        console.error('Error fetching user progress:', error);
        if (error.crmError) {
            return res.status(401).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to retrieve user progress.' });
    }
};

module.exports = {
  submitQuestionnaireAnswers,
  getUserProgress,
  getAllQuestionnaires,
  getQuestionnaireAnswers,
};

