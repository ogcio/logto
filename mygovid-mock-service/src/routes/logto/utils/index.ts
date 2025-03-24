import fs from "fs";
import crypto from "crypto";
import { importPKCS8, importSPKI, SignJWT } from "jose";

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

export const streamToString = (stream: fs.ReadStream): Promise<string> => {
  return new Promise((resolve, reject) => {
    let data = "";

    stream.setEncoding("utf8");
    stream.on("data", (chunk) => data += chunk);
    stream.on("error", reject);
    stream.on("end", () => resolve(data));
  });
};

const getRandomPhoneNumber = () =>
  `+353${Math.floor(Math.random() * 9000000000) + 1000000000}`;

const getRandomString = () => crypto.randomBytes(20).toString("hex");

export const createMockSignedJwt = async (
  user: {
    firstName: string;
    lastName: string;
    email: string;
    sub: string;
    oid: string;
  },
  origin: string,
) => {
  const body = {
    ver: "1.0",
    sub: user.sub,
    auth_time: Date.now(),
    email: user.email,
    oid: user.oid,
    AlternateIds: "",
    BirthDate: "13/06/1941",
    // We need to have a unique static PPSN per user
    PublicServiceNumber: user.email,
    LastJourney: "Login",
    mobile: getRandomPhoneNumber(),
    DSPOnlineLevel: "2",
    DSPOnlineLevelStatic: "2",
    givenName: user.firstName,
    surname: user.lastName,
    CustomerId: "532",
    AcceptedPrivacyTerms: true,
    AcceptedPrivacyTermsVersionNumber: "7",
    SMS2FAEnabled: false,
    AcceptedPrivacyTermsDateTime: 1715582120,
    firstName: user.firstName,
    lastName: user.lastName,
    currentCulture: "en",
    trustFrameworkPolicy: "B2C_1A_MyGovID_signin-v5-PARTIAL2",
    CorrelationId: getRandomString(),
    nbf: 1716804749,
  };

  const alg = "RS256";
  const key = await importPKCS8(privateKey, alg);

  const jwt = await new SignJWT(body)
    .setProtectedHeader({ alg })
    .setAudience("mock_client_id")
    .setIssuedAt()
    .setIssuer(origin)
    .setExpirationTime("2h")
    .sign(key);

  return jwt;
};

export const getPublicKey = async () => await importSPKI(publicKey, "RS256");
