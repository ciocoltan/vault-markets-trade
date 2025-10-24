async function loadHtmlPartial(placeholderId, filePath) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        console.error(`Placeholder element with ID "${placeholderId}" not found.`);
        return;
    }
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
        }
        const html = await response.text();
        placeholder.innerHTML = html;
    } catch (error) {
        console.error(`Error loading partial HTML for "${placeholderId}":`, error);
        placeholder.innerHTML = `<p class="text-red-500 text-center">Error loading content.</p>`;
    }
}

export { loadHtmlPartial };

const getBaseApi = () => {
  return window.location.hostname.includes("localhost")
    ? "http://localhost:3001"
    : "https://vaultmarkets-51f10334fa52.herokuapp.com";
};

export const login = async (email, password, recaptchaToken) => {
  const response = await fetch(`${getBaseApi()}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, recaptchaToken }),
    credentials: "include",
  });
  return response.json();
};

export const register = async (payload) => {
  const response = await fetch(`${getBaseApi()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return response.json();
};

export async function socialLogin(payload) { 
  try {
    const response = await fetch(`${getBaseApi()}/api/auth/social-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error("Social login API call failed:", error);
    return { success: false, message: "Could not connect to the server." };
  }
}

export const getCountryFromTrace = async () => {
  const traceResponse = await fetch("https://cloudflare.com/cdn-cgi/trace");
  const traceText = await traceResponse.text();
  const lines = traceText.split("\n");
  const locLine = lines.find((line) => line.startsWith("loc="));
  if (!locLine) throw new Error("Could not detect country from trace.");
  return locLine.split("=")[1];
};

export const getSumsubToken = async () => {
  const response = await fetch(`${getBaseApi()}/api/kyc/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const { token } = await response.json();
  return token;
};

export const updateCrm = async (answers) => {
  const response = await fetch(`${getBaseApi()}/api/user/questionnaire`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
    credentials: "include",
  });
  return response.json();
};

export const logout = async () => {
  try {
    await fetch(`${getBaseApi()}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout failed", error);
  }
};

export const getCountryNameFromCode = (code) => {
  const countryMap = {
    AF: "Afghanistan",
    AX: "Aland Islands",
    AL: "Albania",
    DZ: "Algeria",
    AS: "American Samoa",
    AD: "Andorra",
    AO: "Angola",
    AI: "Anguilla",
    AQ: "Antarctica",
    AG: "Antigua and Barbuda",
    AR: "Argentina",
    AM: "Armenia",
    AW: "Aruba",
    AU: "Australia",
    AT: "Austria",
    AZ: "Azerbaijan",
    BS: "Bahamas",
    BH: "Bahrain",
    BD: "Bangladesh",
    BB: "Barbados",
    BY: "Belarus",
    BE: "Belgium",
    BZ: "Belize",
    BJ: "Benin",
    BM: "Bermuda",
    BT: "Bhutan",
    BO: "Bolivia",
    BQ: "Bonaire, Sint Eustatius and Saba",
    BA: "Bosnia and Herzegovina",
    BW: "Botswana",
    BV: "Bouvet Island",
    BR: "Brazil",
    IO: "British Indian Ocean Territory",
    BN: "Brunei Darussalam",
    BG: "Bulgaria",
    BF: "Burkina Faso",
    BI: "Burundi",
    KH: "Cambodia",
    CM: "Cameroon",
    CA: "Canada",
    CV: "Cape Verde",
    KY: "Cayman Islands",
    CF: "Central African Republic",
    TD: "Chad",
    CL: "Chile",
    CN: "China",
    CX: "Christmas Island",
    CC: "Cocos (Keeling) Islands",
    CO: "Colombia",
    KM: "Comoros",
    CG: "Congo",
    CD: "Congo, Democratic Republic of the",
    CK: "Cook Islands",
    CR: "Costa Rica",
    CI: "Cote D'Ivoire",
    HR: "Croatia",
    CU: "Cuba",
    CW: "Curacao",
    CY: "Cyprus",
    CZ: "Czech Republic",
    DK: "Denmark",
    DJ: "Djibouti",
    DM: "Dominica",
    DO: "Dominican Republic",
    EC: "Ecuador",
    EG: "Egypt",
    SV: "El Salvador",
    GQ: "Equatorial Guinea",
    ER: "Eritrea",
    EE: "Estonia",
    ET: "Ethiopia",
    FK: "Falkland Islands (Malvinas)",
    FO: "Faroe Islands",
    FJ: "Fiji",
    FI: "Finland",
    FR: "France",
    GF: "French Guiana",
    PF: "French Polynesia",
    TF: "French Southern Territories",
    GA: "Gabon",
    GM: "Gambia",
    GE: "Georgia",
    DE: "Germany",
    GH: "Ghana",
    GI: "Gibraltar",
    GR: "Greece",
    GL: "Greenland",
    GD: "Grenada",
    GP: "Guadeloupe",
    GU: "Guam",
    GT: "Guatemala",
    GG: "Guernsey",
    GN: "Guinea",
    GW: "Guinea-Bissau",
    GY: "Guyana",
    HT: "Haiti",
    HM: "Heard Island and Mcdonald Islands",
    VA: "Holy See (Vatican City State)",
    HN: "Honduras",
    HK: "Hong Kong",
    HU: "Hungary",
    IS: "Iceland",
    IN: "India",
    ID: "Indonesia",
    IR: "Iran, Islamic Republic of",
    IQ: "Iraq",
    IE: "Ireland",
    IM: "Isle of Man",
    IL: "Israel",
    IT: "Italy",
    JM: "Jamaica",
    JP: "Japan",
    JE: "Jersey",
    JO: "Jordan",
    KZ: "Kazakhstan",
    KE: "Kenya",
    KI: "Kiribati",
    KP: "Korea, Democratic People's Republic of",
    KR: "Korea, Republic of",
    KW: "Kuwait",
    KG: "Kyrgyzstan",
    LA: "Lao People's Democratic Republic",
    LV: "Latvia",
    LB: "Lebanon",
    LS: "Lesotho",
    LR: "Liberia",
    LY: "Libyan Arab Jamahiriya",
    LI: "Liechtenstein",
    LT: "Lithuania",
    LU: "Luxembourg",
    MO: "Macao",
    MK: "Macedonia, The Former Yugoslav Republic of",
    MG: "Madagascar",
    MW: "Malawi",
    MY: "Malaysia",
    MV: "Maldives",
    ML: "Mali",
    MT: "Malta",
    MH: "Marshall Islands",
    MQ: "Martinique",
    MR: "Mauritania",
    MU: "Mauritius",
    YT: "Mayotte",
    MX: "Mexico",
    FM: "Micronesia, Federated States of",
    MD: "Moldova, Republic of",
    MC: "Monaco",
    MN: "Mongolia",
    ME: "Montenegro",
    MS: "Montserrat",
    MA: "Morocco",
    MZ: "Mozambique",
    MM: "Myanmar",
    NA: "Namibia",
    NR: "Nauru",
    NP: "Nepal",
    NL: "Netherlands",
    NC: "New Caledonia",
    NZ: "New Zealand",
    NI: "Nicaragua",
    NE: "Niger",
    NG: "Nigeria",
    NU: "Niue",
    NF: "Norfolk Island",
    MP: "Northern Mariana Islands",
    NO: "Norway",
    OM: "Oman",
    PK: "Pakistan",
    PW: "Palau",
    PS: "Palestinian Territory, Occupied",
    PA: "Panama",
    PG: "Papua New Guinea",
    PY: "Paraguay",
    PE: "Peru",
    PH: "Philippines",
    PN: "Pitcairn",
    PL: "Poland",
    PT: "Portugal",
    PR: "Puerto Rico",
    QA: "Qatar",
    RE: "Reunion",
    RO: "Romania",
    RU: "Russian Federation",
    RW: "Rwanda",
    BL: "Saint Barthelemy",
    SH: "Saint Helena, Ascension and Tristan Da Cunha",
    KN: "Saint Kitts and Nevis",
    LC: "Saint Lucia",
    MF: "Saint Martin (French Part)",
    PM: "Saint Pierre and Miquelon",
    VC: "Saint Vincent and the Grenadines",
    WS: "Samoa",
    SM: "San Marino",
    ST: "Sao Tome and Principe",
    SA: "Saudi Arabia",
    SN: "Senegal",
    RS: "Serbia",
    SC: "Seychelles",
    SL: "Sierra Leone",
    SG: "Singapore",
    SX: "Sint Maarten (Dutch Part)",
    SK: "Slovakia",
    SI: "Slovenia",
    SB: "Solomon Islands",
    SO: "Somalia",
    ZA: "South Africa",
    GS: "South Georgia and the South Sandwich Islands",
    SS: "South Sudan",
    ES: "Spain",
    LK: "Sri Lanka",
    SD: "Sudan",
    SR: "Suriname",
    SJ: "Svalbard and Jan Mayen",
    SZ: "Swaziland",
    SE: "Sweden",
    CH: "Switzerland",
    SY: "Syrian Arab Republic",
    TW: "Taiwan, Province of China",
    TJ: "Tajikistan",
    TZ: "Tanzania, United Republic of",
    TH: "Thailand",
    TL: "Timor-Leste",
    TG: "Togo",
    TK: "Tokelau",
    TO: "Tonga",
    TT: "Trinidad and Tobago",
    TN: "Tunisia",
    TR: "Turkey",
    TM: "Turkmenistan",
    TC: "Turks and Caicos Islands",
    TV: "Tuvalu",
    UG: "Uganda",
    UA: "Ukraine",
    AE: "United Arab Emirates",
    GB: "United Kingdom",
    US: "United States",
    UM: "United States Minor Outlying Islands",
    UY: "Uruguay",
    UZ: "Uzbekistan",
    VU: "Vanuatu",
    VE: "Venezuela",
    VN: "Viet Nam",
    VG: "Virgin Islands, British",
    VI: "Virgin Islands, U.S.",
    WF: "Wallis and Futuna",
    EH: "Western Sahara",
    YE: "Yemen",
    ZM: "Zambia",
    ZW: "Zimbabwe",
  };
  return countryMap[code.toUpperCase()] || null;
};

export const getUserProgressFromServer = async () => {
  const response = await fetch(`${getBaseApi()}/api/user/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user progress. Status: ${response.status}`);
  }

  return response.json(); 
};

export async function checkKycStatus() {
  try {
    const response = await fetch(`${getBaseApi()}/api/kyc/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to check KYC status:", error);
    return { success: false, error: error.message };
  }
}

export async function requestPasswordReset(email, recaptchaToken) {
  try {
    const response = await fetch(`${getBaseApi()}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, recaptchaToken }),
    });
    return await response.json();
  } catch (error) {
    console.error("Forgot password request failed:", error);
    return { success: false, message: "Could not connect to the server." };
  }
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function waitForMixpanel(timeout = 3000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (typeof window.mixpanel !== 'undefined' && typeof window.mixpanel.get_distinct_id === 'function') {
                clearInterval(interval);
                resolve(window.mixpanel);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                console.warn("Mixpanel did not load in time.");
                reject(new Error("Mixpanel timeout"));
            }
        }, 100);
    });
}

export async function buildTrackingPayload() {
    const cookieData = getCookie("UrlOriginalQueryParameters");
    let trackingParams = {};
    if (cookieData) {
        try { trackingParams = JSON.parse(cookieData); } catch (err) { console.error("Could not parse tracking cookie:", err); }
    }
    const standardParams = {};
    const extendedFields = {};
    for (const key in trackingParams) {
        if (key.startsWith("utm_")) { standardParams[key] = trackingParams[key]; } 
        else if (["gclid", "fbclid", "msclkid"].includes(key)) { extendedFields[key] = trackingParams[key]; }
    }
    
    try {
        const mixpanel = await waitForMixpanel();
        const fullId = mixpanel.get_distinct_id();
        if (fullId) {
            const idParts = fullId.split(":");
            const finalId = idParts[idParts.length - 1];
            extendedFields.mixpanel_id = finalId;
        }
    } catch (err) {
        console.error("Could not retrieve MixPanel ID:", err.message);
    }

    const payload = { ...standardParams };
    if (Object.keys(extendedFields).length > 0) {
        payload.extended_fields = btoa(JSON.stringify(extendedFields));
    }
    return payload;
}

export async function saveProgressAndRedirect(data) {
    console.log("Login successful:", data);

    const userProgress = {
        userId: data.user?.id || null,
        formData: {},
        userAnswers: data.userAnswers || [],
        questionnaires: data.questionnaires || [],
    };

    if (data.userAnswers && data.userAnswers.length > 0) {
        const KYC_STATUS_QUESTION_ID = "161";
        const KYC_RESULT_QUESTION_ID = "160";

        const kycStatusAnswer = data.userAnswers.find(
            (ans) => ans.eqaq_id.toString() === KYC_STATUS_QUESTION_ID
        );
        const kycResultAnswer = data.userAnswers.find(
            (ans) => ans.eqaq_id.toString() === KYC_RESULT_QUESTION_ID
        );

        if (
            kycStatusAnswer?.a_text === "completed" &&
            kycResultAnswer?.a_text === "GREEN"
        ) {
            console.log("KYC already completed. Generating secure redirect...");

            const targetUrl = "https://my.vaultmarkets.trade/en/account-opening-process";
            const dynamicUrl = await generateRedirectUrl(targetUrl);

            if (dynamicUrl) {
                window.location.replace(dynamicUrl);
            } else {
                console.error("Could not generate dynamic URL, using fallback redirect.");
                window.location.replace(targetUrl);
            }
            return;
        }
    }

    console.log("KYC not completed or status unknown. Proceeding to multistep form.");
    localStorage.setItem("userProgress", JSON.stringify(userProgress));
    window.location.href = "../multistep/";
}

export async function generateRedirectUrl(targetUrl) {
  try {
    const response = await fetch(`${getBaseApi()}/api/auth/generate-redirect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirect: targetUrl }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success && data.url) {
      return data.url;
    } else {
      throw new Error("API did not return a valid redirect URL.");
    }
  } catch (error) {
    console.error("Error generating redirect URL:", error);
    return null; 
  }
}