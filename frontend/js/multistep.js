import "../css/main.css";
import {
  getSumsubToken,
  updateCrm,
  getCountryFromTrace,
  getCountryNameFromCode,
  getUserProgressFromServer,
  checkKycStatus,
  generateRedirectUrl,
  loadHtmlPartial,
} from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([loadHtmlPartial("header-placeholder", "/header.html")]);

  const STEP_FLOW = [
    "1-0",
    "1-1",
    "1-2",
    "2-0",
    "2-1",
    "3-0",
    "3-1",
    "3-2",
    "4-0",
  ];
  const SUBSTEPS_PER_STEP = { 1: 3, 2: 2, 3: 3, 4: 1 };

  const BUTTON_STEPS_CONFIG = {
    "2-0": { questionIndex: 1, formKey: "employmentStatus", crmId: "171" },
    "2-1": { questionIndex: 5, formKey: "industryStatus", crmId: "172" },
    "3-0": { questionIndex: 2, formKey: "experience", crmId: "173" },
    "3-1": { questionIndex: 4, formKey: "riskTolerance", crmId: "174" },
    "3-2": { questionIndex: 8, formKey: "tradingObjective", crmId: "175" },
  };

  const DOM = {
    spinnerOverlay: document.getElementById("spinner-overlay"),
    form: document.getElementById("multi-step-form"),
    mainContainer: document.querySelector(".main-container"),
    formSteps: document.querySelectorAll(".form-step"),
    stepperItems: document.querySelectorAll(".stepper-item"),
    generalError: document.getElementById("general-error"),
    phoneInput: document.getElementById("phone"),
    phoneError: document.getElementById("phone-error"),
    identificationTypeSelect: document.getElementById("identification-type"),
    idNumberInput: document.getElementById("id-number"),
    idNumberWrapper: document.getElementById("id-number-wrapper"),
    dobSectionWrapper: document.getElementById("dob-section-wrapper"),
    dobDay: document.getElementById("dob-day"),
    dobMonth: document.getElementById("dob-month"),
    dobYear: document.getElementById("dob-year"),
    riskModalOverlay: document.getElementById("risk-modal-overlay"),
    riskAcceptCheckbox: document.getElementById("risk-accept-checkbox"),
    riskAgreeBtn: document.getElementById("risk-agree-btn"),
    riskCancelBtn: document.getElementById("risk-cancel-btn"),
    progressConnectors: {
      1: document.getElementById("progress-1"),
      2: document.getElementById("progress-2"),
      3: document.getElementById("progress-3"),
    },
  };

  const toggleSpinner = (show) => {
    if (DOM.spinnerOverlay)
      DOM.spinnerOverlay.classList.toggle("hidden", !show);
  };

  const userProgress = await loadUserProgressOrRedirect();
  if (!userProgress) {
    return;
  }
  let state = {
    currentStepIndex: userProgress?.currentSubStepIndex || 0,
    highestMainStepReached: userProgress?.highestStep || 1,
    formData: userProgress?.formData || {},
  };
  const submissionStatus = {};
  const submissionQueue = [];
  let isProcessingQueue = false;
  const iti = initializePhoneInput();

  async function initializeApp() {
    if (!userProgress) return;
    toggleSpinner(true);
    setupInitialUI();
    populateFormWithSavedData();
    handleIdTypeChange(true);
    updateFormAndStepper();
    toggleSpinner(false);
  }

  const getAnswers = (index) =>
    userProgress.questionnaires?.[0]?.questions?.[index]?.answers || [];

  function setupInitialUI() {
    createDate();
    populateDropdown("nationality", getAnswers(7), "Select Nationality");
    populateDropdown(
      "identification-type",
      getAnswers(10),
      "Select Identification type"
    );
    populateDropdown(
      "residence-country",
      getAnswers(14),
      "Select Residence Country"
    );

    for (const [stepId, config] of Object.entries(BUTTON_STEPS_CONFIG)) {
      populateButtonStep(stepId, config.questionIndex, config.formKey);
    }

    if (DOM.identificationTypeSelect) {
      DOM.identificationTypeSelect.addEventListener('change', () => handleIdTypeChange(false));
    }
    if (DOM.idNumberInput) {
      DOM.idNumberInput.addEventListener('input', handleIdNumberInput);
    }
  }

  async function autofillCountryData() {
    const currentMainStep = STEP_FLOW[state.currentStepIndex];
    const ipCountryName = state.formData.countryByIp;
    if (ipCountryName) {
      if (!state.formData.nationality) {
        const nationalityQuestion = getAnswers(7);
        const countryOption = nationalityQuestion.find(
          (opt) =>
            opt.title && opt.title.toLowerCase() === ipCountryName.toLowerCase()
        );
        if (countryOption) {
          const nationalitySelect = document.getElementById("nationality");
          if (nationalitySelect) {
            nationalitySelect.value = String(countryOption.eqaa_id);
          }
        }
      }
      if (!state.formData.residenceCountry) {
        const residenceQuestion = getAnswers(14);
        const residenceCountryCountryOption = residenceQuestion.find(
          (opt) =>
            opt.title && opt.title.toLowerCase() === ipCountryName.toLowerCase()
        );
        if (residenceCountryCountryOption) {
          const residenceCountrySelect =
            document.getElementById("residence-country");
          if (residenceCountrySelect) {
            residenceCountrySelect.value = String(
              residenceCountryCountryOption.eqaa_id
            );
          }
        }
      }
    }
    console.log("Autofill country data executed for step:", currentMainStep);
  }

  function populateFormWithSavedData() {
    const data = state.formData;
    if (!data || Object.keys(data).length === 0) return;
    Object.entries(data).forEach(([key, value]) => {
      const field = DOM.form.querySelector(
        `[name="${key}"]:not([type="checkbox"])`
      );
      if (field) field.value = value;
    });
    DOM.form.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      const values = data[cb.name];
      if (Array.isArray(values)) {
        const match = values.find((item) => item.value === cb.value);
        if (match) cb.checked = match.checked;
      }
    });
    for (const [stepId, config] of Object.entries(BUTTON_STEPS_CONFIG)) {
      const savedValue = data[config.formKey];
      if (savedValue) {
        const selector = `#step-${stepId} button[data-value="${savedValue}"]`;
        const btn = document.querySelector(selector);
        if (btn) btn.classList.add("active");
      }
    }
    if (data.phone && DOM.phoneInput) DOM.phoneInput.value = data.phone;
  }

  function populateButtonStep(stepId, questionIndex, formKey) {
    const container = document.querySelector(`#step-${stepId} .space-y-3`);
    if (!container) return;
    container.innerHTML = "";
    const answers =
      userProgress.questionnaires?.[0]?.questions?.[questionIndex]?.answers ||
      [];
    answers.forEach((ans) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "step-option-btn w-full py-3 px-4 rounded-full";
      btn.textContent = ans.title;
      btn.dataset.value = ans.eqaa_id;
      btn.dataset.formKey = formKey;
      container.appendChild(btn);
    });
  }

  function populateDropdown(elementId, options, placeholder) {
    const selectEl = document.getElementById(elementId);
    if (!selectEl) return;
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    if (Array.isArray(options)) {
      options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = String(opt.eqaa_id);
        o.textContent = opt.a_text || opt.title;
        selectEl.appendChild(o);
      });
    }
  }

  function createDate() {
    const daySelect = document.getElementById("dob-day"),
      monthSelect = document.getElementById("dob-month"),
      yearSelect = document.getElementById("dob-year");
    if (!daySelect || !monthSelect || !yearSelect) return;
    daySelect.innerHTML = '<option value="">Day</option>';
    monthSelect.innerHTML = '<option value="">Month</option>';
    yearSelect.innerHTML = '<option value="">Year</option>';
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    months.forEach((month, index) => {
      monthSelect.innerHTML += `<option value="${index + 1}">${month}</option>`;
    });
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 18; year >= currentYear - 100; year--) {
      yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    }
    const populateDays = () => {
      const selectedMonth = parseInt(monthSelect.value),
        selectedYear = parseInt(yearSelect.value),
        currentDay = daySelect.value;
      daySelect.innerHTML = '<option value="">Day</option>';
      const daysInMonth =
        selectedMonth && selectedYear
          ? new Date(selectedYear, selectedMonth, 0).getDate()
          : 31;
      for (let day = 1; day <= daysInMonth; day++) {
        daySelect.innerHTML += `<option value="${day}" ${
          day == currentDay ? "selected" : ""
        }>${day}</option>`;
      }
    };
    monthSelect.addEventListener("change", populateDays);
    yearSelect.addEventListener("change", populateDays);
    populateDays();
  }

  function saveState() {
    const storedProgress =
      JSON.parse(localStorage.getItem("userProgress")) || {};
    const dataToSave = {
      ...storedProgress,
      currentSubStepIndex: state.currentStepIndex,
      highestStep: state.highestMainStepReached,
      formData: state.formData,
    };
    localStorage.setItem("userProgress", JSON.stringify(dataToSave));
  }

  async function goToNextStep() {
    const stepIndexToSubmit = state.currentStepIndex;
const currentStepId = STEP_FLOW[stepIndexToSubmit];

    if (!validateStep(stepIndexToSubmit)) return;

    toggleSpinner(true);
    setTimeout(() => {
      toggleSpinner(false);
    }, 1000);

    DOM.generalError.classList.add("hidden");

    const currentStepData = collectCurrentStepFormData();
    state.formData = { ...state.formData, ...currentStepData };

    if (currentStepId === "3-2") {     const experienceText = state.formData.experience_text || "";
      const riskText = state.formData.riskTolerance_text || "";
      const objectiveText = state.formData.tradingObjective_text || "";      
      const hasFailedTest = (experienceText.toLowerCase() === 'no') ||
                            (riskText.toLowerCase() === 'no') ||
                            (objectiveText.toLowerCase() === 'no'); 

      if (hasFailedTest) {
        const agreed = await showRiskModal();
        if (!agreed) {
          return; 
        }
      }
    }

    if (state.currentStepIndex < STEP_FLOW.length - 1) {
      state.currentStepIndex++;
      const mainStep = parseInt(
        STEP_FLOW[state.currentStepIndex].split("-")[0]
      );
      state.highestMainStepReached = Math.max(
        state.highestMainStepReached,
        mainStep
      );
    }

    state.formData.currentStep = STEP_FLOW[state.currentStepIndex];
    saveState();
    updateFormAndStepper();

    // Submit in the background
    submissionStatus[stepIndexToSubmit] = { status: "pending" };

    submissionQueue.push({ stepIndex: stepIndexToSubmit });
    processSubmissionQueue();
  }

  async function processSubmissionQueue() {
    if (isProcessingQueue || submissionQueue.length === 0) {
      return;
    }

    isProcessingQueue = true;
    console.log("Starting to process submission queue...");

    while (submissionQueue.length > 0) {
      const item = submissionQueue.shift();
      const stepIdentifier = STEP_FLOW[item.stepIndex];

      console.log(`Attempting to submit step ${stepIdentifier}...`);

      try {
        const result = await updateCRM(item.stepIndex);
        if (!result.success) {
          throw new Error(
            result.message || `Submission for ${stepIdentifier} failed.`
          );
        }

        console.log(
          `Step ${stepIdentifier} submitted successfully on first try.`
        );
      } catch (error) {
        console.warn(
          `First attempt for step ${stepIdentifier} failed. Retrying in 1 second...`
        );

        await new Promise((resolve) => setTimeout(resolve, 200)); //1000

        try {
          const retryResult = await updateCRM(item.stepIndex);
          if (!retryResult.success) {
            throw new Error(
              retryResult.message || `Retry for ${stepIdentifier} failed.`
            );
          }
          console.log(
            `Step ${stepIdentifier} submitted successfully on retry.`
          );
        } catch (retryError) {
          console.error(
            `Final attempt for step ${stepIdentifier} failed. Triggering recovery.`
          );

          handleSubmissionErrorAndRecover();
          submissionQueue.length = 0;
          break;
        }
      }
    }

    isProcessingQueue = false;
    console.log("Submission queue processing finished.");
  }

  async function handleSubmissionErrorAndRecover() {
    console.error(
      "A background submission failed. Attempting to recover state from server."
    );
    toggleSpinner(true);
    DOM.generalError.textContent =
      "Syncing error. Restoring your last saved progress...";
    DOM.generalError.classList.remove("hidden");

    try {
      const serverProgress = await getUserProgressFromServer();
      localStorage.setItem("userProgress", JSON.stringify(serverProgress));
      const lastSavedStep = serverProgress.formData?.currentStep || "1-0";
      const lastSavedStepIndex = STEP_FLOW.indexOf(lastSavedStep);
      state.currentStepIndex = lastSavedStepIndex >= 0 ? lastSavedStepIndex : 0;
      state.formData = createFormDataFromUserAnswers(serverProgress.userAnswers);
      populateFormWithSavedData();
      updateFormAndStepper();
      DOM.generalError.textContent =
        "There was a problem saving. Your progress has been restored to the last successful save.";
    } catch (error) {
      console.error("Recovery failed:", error);
      DOM.generalError.textContent =
        "Critical sync error. Please refresh the page.";
    } finally {
      Object.keys(submissionStatus).forEach(
        (key) => delete submissionStatus[key]
      );
      toggleSpinner(false);
    }
  }

  function collectCurrentStepFormData() {
    const data = {};
    const currentStepEl = document.getElementById(
      `step-${STEP_FLOW[state.currentStepIndex]}`
    );
    if (!currentStepEl) return data;
    currentStepEl.querySelectorAll("input, select").forEach((field) => {
      if (field.type === "checkbox") {
        if (!data[field.name]) data[field.name] = [];
        data[field.name].push({ value: field.value, checked: field.checked });
      } else if (field.tagName === "SELECT") {
        if (field.value) data[field.name] = field.value;
        const option = field.options[field.selectedIndex];
        if (option) data[`${field.name}_text`] = option.text.trim();
      } else if (field.value) {
        data[field.name] = field.value.trim();
      }
    });
    if (
      DOM.phoneInput &&
      currentStepEl.contains(DOM.phoneInput) &&
      DOM.phoneInput.value
    ) {
      data.phone = iti.getNumber();
    }

    return data;
  }

  async function updateFormAndStepper() {
    DOM.formSteps.forEach((step) => (step.style.display = "none"));
    const currentStepId = `step-${STEP_FLOW[state.currentStepIndex]}`;
    const currentStepElement = document.getElementById(currentStepId);
    if (currentStepElement) currentStepElement.style.display = "block";
    const [mainStep, subStep] = STEP_FLOW[state.currentStepIndex]
      .split("-")
      .map(Number);
    DOM.stepperItems.forEach((item) => {
      const step = parseInt(item.dataset.step);
      const counter = item.querySelector(".step-counter");
      item.className = "stepper-item";
      if (step < mainStep) {
        item.classList.add("completed");
        counter.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;
      } else if (step === mainStep) {
        item.classList.add("active");
        counter.textContent = step;
      } else {
        item.classList.add(
          step <= state.highestMainStepReached ? "visited" : "inactive"
        );
        counter.textContent = step;
      }
    });
    Object.keys(DOM.progressConnectors).forEach((stepKey) => {
      const stepNum = parseInt(stepKey);
      const progressBar = DOM.progressConnectors[stepNum];
      if (!progressBar) return;
      if (stepNum < mainStep) {
        progressBar.style.width = "100%";
      } else if (stepNum === mainStep) {
        const totalSubsteps = SUBSTEPS_PER_STEP[mainStep] || 1;
        const progressPercentage = (subStep / totalSubsteps) * 100;
        progressBar.style.width = `${progressPercentage}%`;
      } else {
        progressBar.style.width = "0%";
      }
    });
    if (STEP_FLOW[state.currentStepIndex] === "4-0") await sumsubKYC();
  }

  function validateStep(index) {
    const stepId = STEP_FLOW[index];
    const stepEl = document.getElementById(`step-${stepId}`);
    if (!stepEl) return true;
    let isValid = true;
    stepEl.querySelectorAll("[required]").forEach((field) => {
      clearError(field);
      if (
        (field.type === "checkbox" && !field.checked) ||
        (field.type !== "checkbox" && !field.value)
      ) {
        showError(field, "This field is required.");
        isValid = false;
      }
    });
    if (stepId === "1-0") {
      if (!validatePhone()) {
        isValid = false;
      }
    }
    if (stepId === "1-1") {
      const selectedText =
        DOM.identificationTypeSelect.options[
          DOM.identificationTypeSelect.selectedIndex
        ].text;

      // --- Validate ID Number ---
      if (selectedText === "South African ID") {
        const idString = DOM.idNumberInput.value;
        if (idString.length !== 13) {
          showError(DOM.idNumberInput, "ID number must be 13 digits.");
          isValid = false;
        } else if (!isValidLuhn(idString)) {
          showError(
            DOM.idNumberInput,
            "Invalid ID number. Please check the number."
          );
          isValid = false;
        } else if (!parseDOBFromSAID(idString)) {
          showError(
            DOM.idNumberInput,
            "ID number contains an invalid date or you are under 18."
          );
          isValid = false;
        }
      } else if (selectedText === "Passport") {
        const idString = DOM.idNumberInput.value;
        const idRegex = /^[a-zA-Z0-9]{6,15}$/;
        if (!idRegex.test(idString)) {
          showError(
            DOM.idNumberInput,
            "Passport must be 6-15 letters and numbers."
          );
          isValid = false;
        }
      }

      // --- Conditionally validate DOB ---
      if (DOM.dobSectionWrapper.style.display !== "none") {
        const day = DOM.dobDay;
        const month = DOM.dobMonth;
        const year = DOM.dobYear;
        const dobErrorEl = document.getElementById("error-dob-day");

        clearError(day); // Clear previous errors
        if (!day.value || !month.value || !year.value) {
          isValid = false;
          day.classList.add("error");
          month.classList.add("error");
          year.classList.add("error");
          if (dobErrorEl) {
            dobErrorEl.textContent = "This field is required.";
            dobErrorEl.classList.remove("hidden");
          }
        }
      }

      stepEl
        .querySelectorAll('input[type="checkbox"][required]')
        .forEach((cb) => {
          clearError(cb);
          if (!cb.checked) {
            isValid = false;

            // Find the specific error element by its ID
            const errorEl = document.getElementById(`error-${cb.id}`);
            let msg = "You must agree to the Terms & Conditions.";
            if (cb.id === "not-us-citizen") {
              msg = "You must confirm you are not a US citizen.";
            }

            // Show the error directly
            if (errorEl) {
              errorEl.textContent = msg;
              errorEl.classList.remove("hidden");
            }
            // Add error class to the checkbox itself for styling
            cb.classList.add("error");
          }
        });
    }
    return isValid;
  }

  const validatePhone = () => {
    const errorEl = document.getElementById("error-phone");
    const itiContainer = DOM.phoneInput.closest(".iti");
    if (errorEl) errorEl.classList.add("hidden");
    if (itiContainer) itiContainer.classList.remove("error");
    if (!DOM.phoneInput.value.trim()) {
      if (errorEl) {
        errorEl.textContent = "This field is required.";
        errorEl.classList.remove("hidden");
      }
      if (itiContainer) itiContainer.classList.add("error");
      return false;
    }
    if (!iti.isValidNumber()) {
      if (errorEl) {
        errorEl.textContent = "Invalid phone number.";
        errorEl.classList.remove("hidden");
      }
      if (itiContainer) itiContainer.classList.add("error");
      return false;
    }
    return true;
  };

  function showError(el, msg) {
    if (!el) return;
    el.classList.add("error");
    const errorEl = el.parentElement.querySelector(".error-text");

    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove("hidden");
    }
  }

  function clearError(el) {
    if (!el) return;
    el.classList.remove("error");

    // Generic case for simple fields (like First Name, Last Name)
    const genericErrorEl = el.parentElement.querySelector(".error-text");
    if (genericErrorEl) {
      genericErrorEl.classList.add("hidden");
    }

    // handling for Step 1-1 Checkboxes
    if (el.id === "not-us-citizen") {
      const specificErrorEl = document.getElementById(`error-${el.id}`);
      if (specificErrorEl) {
        specificErrorEl.classList.add("hidden");
      }
    }

    // Special handling for Date of Birth group
    if (el.id.startsWith("dob-")) {
      document.getElementById("dob-day").classList.remove("error");
      document.getElementById("dob-month").classList.remove("error");
      document.getElementById("dob-year").classList.remove("error");
      const dobErrorEl = document.getElementById("error-dob-day");
      if (dobErrorEl) dobErrorEl.classList.add("hidden");
    }
  }

  async function updateCRM(stepIndex) {
    try {
      const crmPayload = mapCumulativeDataForCrm(stepIndex);

      if (crmPayload.length <= 1) {
        return { success: true };
      }

      const result = await updateCrm(crmPayload);

      if (result.message === "Unauthorized" || result.status === 401) {
        window.location.replace("../login/");
        return {
          success: false,
          message: "Session expired. Please log in again.",
        };
      }
      if (!result.success) {
        console.error("CRM Update Failed:", result);
        return {
          success: false,
          message: result.message || "Failed to save progress.",
        };
      }
      return { success: true };
    } catch (e) {
      console.error("CRM Update Exception:", e);
      return {
        success: false,
        message: "A network error occurred. Please try again.",
      };
    }
  }

  function mapCumulativeDataForCrm(upToStepIndex) {
    const allData = state.formData;

    // This object defines the data structure for each step
    const dataFragments = {
      "1-0": [
        { eqaq_id: "162", eqaa_text: allData.fname || "" },
        { eqaq_id: "163", eqaa_text: allData.lname || "" },
        {
          eqaq_id: "164",
          eqaa_id: allData.country_id || "",
          eqaa_text: allData.country_id_text || "",
        },
        { eqaq_id: "165", eqaa_text: allData.phone },
      ],
      "1-1": [
        {
          eqaq_id: "166",
          eqaa_id: allData.identificationType || "",
          eqaa_text: allData.identificationType_text || "",
        },
        {
          eqaq_id: "167",
          eqaa_text: allData.idNumber || "",
        },
        {
          eqaq_id: "168",
          eqaa_text: `${allData["dob-year"] || ""}/${
            allData["dob-month"] || ""
          }/${allData["dob-day"] || ""}`,
        },
      ],
      "1-2": [
        {
          eqaq_id: "170",
          eqaa_id: allData.residenceCountry || "",
          eqaa_text: allData.residenceCountry_text || "",
        },
        {
          eqaq_id: "169",
          eqaa_id: "4822",
          eqaa_text: allData.notUsCitizen?.[0]?.value || "",
        },
      ],
    };

    // Add button step data fragments
    for (const [stepId, config] of Object.entries(BUTTON_STEPS_CONFIG)) {
      if (allData[config.formKey]) {
        dataFragments[stepId] = [
          {
            eqaq_id: config.crmId,
            eqaa_id: allData[config.formKey],
            eqaa_text: allData[`${config.formKey}_text`] || "",
          },
        ];
      }
    }

    const crmData = [];
    // Loop from the start up to the specified index
    for (let i = 0; i <= upToStepIndex; i++) {
      const stepKey = STEP_FLOW[i];
      if (dataFragments[stepKey]) {
        crmData.push(...dataFragments[stepKey]);
      }
    }

    const completedStepKey = STEP_FLOW[upToStepIndex];
    let stepToSave = completedStepKey;

    // If the user just finished step 3-2, save their progress as 4-0
    if (completedStepKey === "3-2") {
      stepToSave = "4-0";
    }
    crmData.push({
      eqaq_id: "176",
      eqaa_text: stepToSave,
    });

    return crmData;
  }

  DOM.form.addEventListener("click", async (event) => {
    const target = event.target;
    if (target.matches(".next-btn")) {
      await goToNextStep();
    } else if (target.matches(".back-btn")) {
      goToPreviousStep();
    } else if (target.matches(".step-option-btn")) {
      const { value, formKey } = target.dataset;
      state.formData[formKey] = value;
      state.formData[`${formKey}_text`] = target.textContent.trim();
      target
        .closest(".form-step")
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      target.classList.add("active");
      await goToNextStep();
    }
  });

  DOM.stepperItems.forEach((item) => {
    item.addEventListener("click", () => {
      const clickedStep = parseInt(item.dataset.step);
      if (clickedStep <= state.highestMainStepReached) {
        const targetIndex = STEP_FLOW.findIndex((s) =>
          s.startsWith(`${clickedStep}-`)
        );
        if (targetIndex !== -1) {
          state.currentStepIndex = targetIndex;
          updateFormAndStepper();
          saveState();
        }
      }
    });
  });

  DOM.form
    .querySelectorAll("[required], input[type='tel']")
    .forEach((field) => {
      field.addEventListener("input", () => clearError(field));
      field.addEventListener("change", () => clearError(field));
    });

  async function loadUserProgressOrRedirect() {
    console.log("Loading user progress...");

    const progress = JSON.parse(localStorage.getItem("userProgress"));
    if (!progress) {
      window.location.href = "../login/";
      return null;
    }

    if (
      progress.formData &&
      Object.keys(progress.formData).length === 0 &&
      progress.userAnswers
    ) {
      progress.formData = createFormDataFromUserAnswers(progress.userAnswers);
      localStorage.setItem("userProgress", JSON.stringify(progress));
    }

    if (progress.formData?.currentStep) {
      const savedStepIndex = STEP_FLOW.findIndex(
        (step) => step === progress.formData.currentStep
      );
      if (savedStepIndex > -1) {
        progress.currentSubStepIndex = savedStepIndex;
      }
    }

    return progress;
  }

  function createFormDataFromUserAnswers(userAnswers) {
    const newFormData = {};
    userAnswers.forEach((ans) => {
      const v = ans.a_text,
        id = ans.eqaa_id,
        qid = ans.eqaq_id.toString();
      switch (qid) {
        case "162":
          newFormData.fname = v;
          break;
        case "163":
          newFormData.lname = v;
          break;
        case "168":
          const [y, m, d] = v.split("/");
          newFormData["dob-year"] = y || "";
          newFormData["dob-month"] = m || "";
          newFormData["dob-day"] = d || "";
          break;
        case "164":
          newFormData.country_id = id || v;
          newFormData.country_id_text = v;
          break;
        case "165":
          newFormData.phone_text = v;
          newFormData.phone = v;
          break;
        case "176":
          newFormData.currentStep = v;
          break;
        case "166":
          newFormData.identificationType = id || v;
          newFormData.identificationType_text = v;
          break;
          case "167":
          newFormData.idNumber = v;
          break;
        case "170":
          newFormData.residenceCountry = id || v;
          newFormData.residenceCountry_text = v;
          break;
        case "169":
          newFormData.notUsCitizen = [{ value: v, checked: v === "Yes" }];
          break;
        case "171":
          newFormData.employmentStatus = id || v;
          newFormData.employmentStatus_text = v;
          break;
        case "172":
          newFormData.industryStatus = id || v;
          newFormData.industryStatus_text = v;
          break;
        case "173":
          newFormData.experience = id || v;
          newFormData.experience_text = v;
          break;
        case "174":
          newFormData.riskTolerance = id || v;
          newFormData.riskTolerance_text = v;
          break;
        case "175":
          newFormData.tradingObjective = id || v;
          newFormData.tradingObjective_text = v;
          break;
      }
    });
    return newFormData;
  }

  function initializePhoneInput() {
    if (!DOM.phoneInput) return null;
    return window.intlTelInput(DOM.phoneInput, {
      utilsScript:
        "https://cdn.jsdelivr.net/npm/intl-tel-input@23.1.0/build/js/utils.js",
      initialCountry: "auto",
      geoIpLookup: async (callback) => {
        const countryCode = await getCountryFromTrace();
        callback(countryCode || "us");
        if (countryCode) {
          state.formData.countryByIp = await getCountryNameFromCode(
            countryCode
          );
          saveState();
          await autofillCountryData();
        }
      },
    });
  }

  async function startKycStatusPolling() {
    const POLLING_INTERVAL = 5000; // Check every 5 seconds
    const MAX_ATTEMPTS = 60; // Stop after 5 minutes (60 attempts * 5 seconds)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= MAX_ATTEMPTS) {
        if (DOM.kycStatusMessage) {
          DOM.kycStatusMessage.textContent =
            "Verification is taking longer than expected. We will notify you by email once it's complete.";
        }
        toggleSpinner(false);
        return; // Stop polling
      }

      attempts++;
      console.log(`Checking KYC status, attempt #${attempts}`);
      const result = await checkKycStatus();

      if (
        result.success &&
        result.status === "completed" &&
        result.result === "GREEN"
      ) {
        console.log(
          "KYC Verification successful! Generating secure redirect..."
        );
        const targetUrl =
          "https://my.vaultmarkets.trade/en/account-opening-process";
        const dynamicUrl = await generateRedirectUrl(targetUrl);

        if (dynamicUrl) {
          window.location.replace(dynamicUrl);
        } else {
          console.error(
            "Could not generate dynamic URL, using fallback redirect."
          );
          window.location.replace(targetUrl);
        }
      } else {
        setTimeout(poll, POLLING_INTERVAL);
      }
    };

    poll(); // Start the polling process
  }

  async function sumsubKYC() {
    const container = document.getElementById("sumsub-websdk-container");
    if (!container) return;
    try {
      const token = await getSumsubToken();
      if (token) launchWebSdk(token);
    } catch (error) {
      console.error("Error fetching Sumsub token:", error);
    }
  }

  function launchWebSdk(accessToken) {
    const sdk = snsWebSdk
      .init(accessToken, () => getSumsubToken())
      .withConf({ lang: "en", theme: "light" })
      .withOptions({ addViewportTag: false, adaptIframeHeight: true })
      .on("idCheck.onStepCompleted", (p) => console.log("Step completed:", p))
      .on("idCheck.onError", (e) => console.error("Sumsub error:", e))
      .on("idCheck.onApplicantSubmitted", (payload) => {
        console.log("Applicant submitted documents:", payload);
        startKycStatusPolling();
      })
      .build();
    sdk.launch("#sumsub-websdk-container");
  }

  function goToPreviousStep() {
    if (state.currentStepIndex > 0) {
      state.currentStepIndex--;
      updateFormAndStepper();
      saveState();
    }
  }

  DOM.form.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const target = e.target;
    if (target.tagName !== "INPUT" && target.tagName !== "SELECT") return;
    e.preventDefault();
    const currentStepEl = target.closest(".form-step");
    if (!currentStepEl) return;
    const focusable = Array.from(
      currentStepEl.querySelectorAll('input:not([type="hidden"]), select')
    );
    const currentIndex = focusable.indexOf(target);
    const nextIndex = currentIndex + 1;
    if (nextIndex < focusable.length) {
      focusable[nextIndex].focus();
    } else {
      const nextButton = currentStepEl.querySelector(".next-btn");
      if (nextButton) {
        nextButton.click();
      }
    }
  });

  //  Validates a number string using the Luhn algorithm.  
  function isValidLuhn(numberString) {
    let sum = 0;
    const length = numberString.length;
    const parity = (length - 1) % 2; // Adjusted parity for 0-based index
    for (let i = 0; i < length - 1; i++) {
      let digit = parseInt(numberString[i], 10);
      if (i % 2 === parity) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
    }
    const lastDigit = parseInt(numberString[length - 1], 10);
    const checkDigit = (10 - (sum % 10)) % 10;
    console.log(lastDigit, checkDigit);
    
    return lastDigit === checkDigit;
  }

  function parseDOBFromSAID(idString) {
    if (idString.length !== 13) return null;

    const dobString = idString.substring(0, 6);
    let year = parseInt(dobString.substring(0, 2), 10);
    const month = parseInt(dobString.substring(2, 4), 10);
    const day = parseInt(dobString.substring(4, 6), 10);

    year = year + (year < (new Date().getFullYear() % 100) + 5 ? 2000 : 1900);

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const testDate = new Date(year, month - 1, day);
    if (
      testDate.getFullYear() !== year ||
      testDate.getMonth() + 1 !== month ||
      testDate.getDate() !== day
    ) {
      return null; 
    }

    // Check if user is 18+
    const today = new Date();
    const minBirthDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    if (testDate > minBirthDate) {
      console.warn("User is under 18 based on ID.");
      return null;
    }

    return { day, month, year };
  }

  function toggleSection(wrapper, show, fields = []) {
    if (!wrapper) return;
    wrapper.style.display = show ? "block" : "none";
    fields.forEach((field) => {
      field.required = show;
      if (!show) clearError(field);
    });
  }

  function handleIdTypeChange(isInitialLoad = false) {
    const selectedText = DOM.identificationTypeSelect.options[DOM.identificationTypeSelect.selectedIndex].text;
    clearError(DOM.idNumberInput);
    
    if (!isInitialLoad) { 
        DOM.idNumberInput.value = ""; 
    }

    if (selectedText === "South African ID") {
        toggleSection(DOM.idNumberWrapper, true, [DOM.idNumberInput]);
        DOM.idNumberInput.placeholder = "13 digits, numbers only";
        DOM.idNumberInput.type = "tel";
        DOM.idNumberInput.maxLength = 13;
        toggleSection(DOM.dobSectionWrapper, false, [DOM.dobDay, DOM.dobMonth, DOM.dobYear]);
    } else if (selectedText === "Passport") {
        toggleSection(DOM.idNumberWrapper, true, [DOM.idNumberInput]);
        DOM.idNumberInput.placeholder = "6-15 letters and numbers";
        DOM.idNumberInput.type = "text";
        DOM.idNumberInput.maxLength = 15;
        toggleSection(DOM.dobSectionWrapper, true, [DOM.dobDay, DOM.dobMonth, DOM.dobYear]);
    } else {
        toggleSection(DOM.idNumberWrapper, false, [DOM.idNumberInput]);
        toggleSection(DOM.dobSectionWrapper, false, [DOM.dobDay, DOM.dobMonth, DOM.dobYear]);
    }
  }

  function handleIdNumberInput() {
    const idString = DOM.idNumberInput.value;
    const selectedText =
      DOM.identificationTypeSelect.options[
        DOM.identificationTypeSelect.selectedIndex
      ].text;

    if (selectedText !== "South African ID") return;

    DOM.idNumberInput.value = idString.replace(/[^0-9]/g, "");
    clearError(DOM.idNumberInput);

    toggleSection(DOM.dobSectionWrapper, false, [
      DOM.dobDay,
      DOM.dobMonth,
      DOM.dobYear,
    ]);

    if (DOM.idNumberInput.value.length === 13) {
      if (!isValidLuhn(DOM.idNumberInput.value)) {
        showError(
          DOM.idNumberInput,
          "Invalid ID checksum. Please check the number."
        );
        return;
      }

      const dob = parseDOBFromSAID(DOM.idNumberInput.value);
      if (!dob) {
        showError(
          DOM.idNumberInput,
          "Invalid ID. Please check the date of birth or age."
        );
        return;
      }

      DOM.dobDay.value = dob.day;
      DOM.dobMonth.value = dob.month;
      DOM.dobYear.value = dob.year;
    }
  }


  //  Shows the risk warning modal and returns a Promise.

  function showRiskModal() {
    return new Promise((resolve) => {
      DOM.riskModalOverlay.classList.remove("hidden");
      DOM.riskAgreeBtn.disabled = true;
      DOM.riskAcceptCheckbox.checked = false;

      const onCheckboxChange = () => {
        DOM.riskAgreeBtn.disabled = !DOM.riskAcceptCheckbox.checked;
      };

      const onAgree = () => {
        cleanup();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        DOM.riskModalOverlay.classList.add("hidden");
        DOM.riskAcceptCheckbox.removeEventListener('change', onCheckboxChange);
        DOM.riskAgreeBtn.removeEventListener('click', onAgree);
        DOM.riskCancelBtn.removeEventListener('click', onCancel);
      };

      DOM.riskAcceptCheckbox.addEventListener('change', onCheckboxChange);
      DOM.riskAgreeBtn.addEventListener('click', onAgree);
      DOM.riskCancelBtn.addEventListener('click', onCancel);
    });
  }

  initializeApp();
});
