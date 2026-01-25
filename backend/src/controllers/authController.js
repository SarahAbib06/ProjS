import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { UAParser } from 'ua-parser-js';
import User from '../models/User.js';
import PendingUser from '../models/PendingUser.js';
import sendEmail from '../utils/sendEmail.js';

// ========================================
// FONCTION UNIQUE DE GÉNÉRATION D'OTP
// ========================================
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ========================================
// FONCTION UNIVERSELLE JWT — UNE SEULE POUR TOUTES LES FONCTIONNALITÉS
// ========================================
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// ========================================
// ENVOIE EMAIL À CHAQUE CONNEXION
// ========================================
const sendLoginAlertEmail = async (user, req, email) => {
  console.log('\nENVOI ALERTE CONNEXION POUR:', email);
  const userAgent = req.headers['user-agent'] || 'Inconnu';
  const rawIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'Inconnu';
  const ip = rawIp.replace('::ffff:', '');
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  const deviceInfo = `${result.browser.name || 'Inconnu'} ${result.browser.version?.split('.')[0] || ''} on ${result.os.name || 'Inconnu'} ${result.os.version?.split('.')[0] || ''}`.trim();
  // let location = 'Localisation inconnue';
  try {
    const geo = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 5000 });
    if (geo.data.status === 'success') {
      location = `${geo.data.city || 'Ville inconnue'}, ${geo.data.country || 'Pays inconnu'}`;
    }
  } catch (err) {
    console.log('Géoloc échouée:', err.message);
  }
  const loginTime = new Date().toLocaleString('fr-DZ', { timeZone: 'Africa/Algiers' });
  const html = `
    <div style="font-family:Arial;text-align:center;padding:30px;background:#e8f5e9;border-radius:12px;">
      <h2 style="color:#2e7d32;">Connexion réussie</h2>
      <p>Quelqu'un s'est connecté à votre compte Owly.</p>
      <hr style="margin:20px 0;">
      <p><strong>Appareil :</strong> ${deviceInfo}</p>
      <p><strong>Heure :</strong> ${loginTime}</p>
      <hr style="margin:20px 0;">
      <p style="color:#d32f2f;">Si ce n'était pas vous, changez votre mot de passe immédiatement !</p>
      <a href="${process.env.CLIENT_URL}/forgot-password" style="background:#d32f2f;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">
        Changer le mot de passe
      </a>
    </div>
  `;
  await sendEmail(email, 'Connexion détectée - Owly', 'Connexion réussie', html);
  console.log('EMAIL ALERTE CONNEXION ENVOYÉ !\n');
};

// ========================================
// 1. REGISTER
// ========================================
export const register = async (req, res) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;
    // Username : autorise uniquement lettres, chiffres, ".", "-", "_"
// Et interdit tout espace ou caractères bizarres
const usernameRegex = /^[a-zA-Z0-9_.-]+$/;

if (!usernameRegex.test(username)) {
  return res.status(400).json({
    message: " nom d'utilisateur invalide "
  });
}

    // Normalisation du username
let cleanUsername = username
  .normalize("NFKD")      // retire accents + normalise unicode
  .replace(/\p{Diacritic}/gu, "") // enlève les accents restants
  .trim()
  .toLowerCase()
  .replace(/[\s\u00A0]/g, ""); // retire TOUT type d'espace
  
if (cleanUsername.length < 3 || cleanUsername.length > 30) {
  return res.status(400).json({ message: "Le nom d'utilisateur doit contenir entre 3 et 30 caractères." });
}


    if (!username || !email || !password || !passwordConfirm) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[{\]};:'"\\|,.<>/?`~]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: ' mot de passe faible ',
      });
    }
    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Adresse email invalide.' });
    }
    const existingUsername = await User.findOne({ username: cleanUsername });

    if (existingUsername) {
      return res.status(400).json({ message: "Ce nom d'utilisateur existe déjà" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un compte existe déjà pour cet e-mail.' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await PendingUser.findOneAndUpdate(
      { email },
      {  username: cleanUsername, email, passwordHash, otp, otpExpires , profilePicture: "https://res.cloudinary.com/dv9oqjulh/image/upload/v1764324539/photo_de_profil_par_defaut_j3qm1p.png"},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const html = `
     <div style="font-family:Arial;text-align:center;padding:30px;background:#f9ee34;border-radius:12px;">
  <h2 style="color:#000;">Vérifiez votre inscription</h2>
  <p style="color:#000;">Voici votre code de vérification :</p>

  <h1 style="
    font-size:38px;
    letter-spacing:10px;
    color:#fff;                 /* CODE EN BLANC */
    background:#000;            /* Optionnel : fond noir pour plus de contraste */
    padding:15px;
    border-radius:10px;
    display:inline-block;
  ">
    ${otp}
  </h1>

  <p style="color:#555;">Valable 10 minutes</p>
</div>

    `;
    await sendEmail(email, 'Vérification - Owly', `Code: ${otp}`, html);

    return res.status(200).json({ message: "OTP envoyé à l'adresse e-mail." });
  } catch (err) {
    console.error('ERREUR REGISTER:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ========================================
// 2. VERIFY OTP (INSCRIPTION)
// ========================================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email et OTP requis.' });
    const pending = await PendingUser.findOne({ email });
    if (!pending) return res.status(400).json({ message: 'Aucune inscription en attente trouvée.' });
    if (pending.otp !== otp) return res.status(400).json({ message: 'OTP invalide.' });
    if (pending.otpExpires < new Date()) {
      await PendingUser.deleteOne({ email });
      return res.status(400).json({ message: 'OTP expiré. Veuillez renvoyer un nouvel OTP.' });
    }
    const newUser = await User.create({
      username: pending.username,
      email: pending.email,
      passwordHash: pending.passwordHash,
      profilePicture: "https://res.cloudinary.com/dv9oqjulh/image/upload/v1764324539/photo_de_profil_par_defaut_j3qm1p.png"
    });
    await PendingUser.deleteOne({ email });

    // UNE SEULE FONCTION → TOKEN INSCRIPTION
    const token = generateToken({ id: newUser._id, email: newUser.email });

    return res.status(201).json({
      message: 'Compte créé avec succès.',
      data: { token, user: { id: newUser._id, username: newUser.username, email: newUser.email } },
    });
  } catch (err) {
    console.error('ERREUR VERIFY OTP:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ========================================
// 3. RESEND OTP
// ========================================
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis.' });
    const pending = await PendingUser.findOne({ email });
    if (!pending) return res.status(400).json({ message: 'Aucune inscription en attente trouvée.' });
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    pending.otp = otp;
    pending.otpExpires = otpExpires;
    await pending.save();

    const html = `
    <div style="font-family:Arial;text-align:center;padding:30px;background:#f9ee34;border-radius:12px;">
  <h2 style="color:#000;">Nouveau code OTP</h2>
  
  <p style="color:#000;">Voici votre nouveau code de vérification :</p>

  <h1 style="
    font-size:38px;
    letter-spacing:10px;
    color:#fff;               /* CODE EN BLANC */
    background:#000;          /* FOND NOIR POUR CONTRASTE */
    padding:15px;
    border-radius:10px;
    display:inline-block;
  ">
    ${otp}
  </h1>

  <p style="color:#555;">Valable 10 minutes</p>
</div>

    `;
    await sendEmail(email, 'Nouveau code - Owly', `Code: ${otp}`, html);

    return res.status(200).json({ message: 'OTP renvoyé.' });
  } catch (err) {
    console.error('ERREUR RESEND OTP:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ========================================
// 4. LOGIN
// ========================================
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis' });
  if (password.length < 8) return res.status(400).json({ message: 'Le mot de passe doit contenir au min 8 caractères' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Identifiants invalides' });

    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    if (user.lockedUntil && now < user.lockedUntil) {
      const secondsLeft = Math.ceil((user.lockedUntil - now) / 1000);
      return res.status(429).json({ message: `Trop de tentatives. Réessayez dans ${secondsLeft}s.`, retryAfter: secondsLeft });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      if (user.lastFailedAttempt && now - user.lastFailedAttempt > 15 * 60 * 1000) {
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
      }
      user.failedLoginAttempts += 1;
      user.lastFailedAttempt = now;
      if (user.failedLoginAttempts >= 3) user.lockedUntil = new Date(now.getTime() + 15 * 1000);
      await user.save();

      if (user.failedLoginAttempts === 3) {
        const resetToken = generateToken({ userId: user._id, type: 'reset' }, '15m');
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        const html = `
          <div style="font-family:Arial;text-align:center;padding:30px;background:#ffebee;border-radius:12px;">
            <h2 style="color:#d32f2f;">Tentative de connexion suspecte</h2>
            <p>3 tentatives échouées détectées.</p>
            <p><strong>Dernière :</strong> ${now.toLocaleString('fr-DZ', { timeZone: 'Africa/Algiers' })}</p>
            <a href="${resetUrl}" style="background:#d32f2f;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">
              Changer le mot de passe
            </a>
          </div>
        `;
        await sendEmail(email, 'Alerte sécurité - Owly', 'Tentative suspecte', html);
      }
      return res.status(401).json({ message: 'Mot de passe incorrect', attempts: user.failedLoginAttempts });
    }

    user.failedLoginAttempts = 0;
    user.lastFailedAttempt = undefined;
    user.lockedUntil = null;
    user.lastSeen = now;
    await user.save();

    await sendLoginAlertEmail(user, req, email);

    if (user.lastSeen >= oneWeekAgo) {
      const token = generateToken({ id: user._id });
      return res.json({ message: 'Connexion réussie (dans les 7 jours)', id: user._id, username: user.username, email: user.email, token });
    }

    const otp = generateOtp();
    const otpToken = generateToken({ userId: user._id, otp, type: 'inactivity' }, '10m');
    const verifyUrl = `${process.env.CLIENT_URL}/verify-otp?token=${otpToken}`;
    const html = `
      <div style="font-family:Arial;text-align:center;padding:30px;background:#fff3e0;border-radius:12px;">
        <h2 style="color:#ff8f00;">Vérification de sécurité</h2>
        <p>Compte inactif depuis plus de 7 jours.</p>
        <h1 style="font-size:38px;letter-spacing:10px;color:#ff8f00;background:#fff8e1;padding:15px;border-radius:10px;display:inline-block;">
          ${otp}
        </h1>
        <p style="color:#555;">Valable 10 minutes</p>
        <a href="${verifyUrl}" style="background:#ff8f00;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">
          Vérifier
        </a>
      </div>
    `;
    await sendEmail(email, 'Vérification - Owly', `Code: ${otp}`, html);
    return res.json({ message: 'Vérification requise', requiresOtp: true, email, debug_token: otpToken });

  } catch (err) {
    console.error('ERREUR LOGIN:', err.message);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ========================================
// 5. VÉRIFIER OTP INACTIVITÉ
// ========================================
export const verifyInactivityOtp = async (req, res) => {
  const { token, otp } = req.body;
  if (!token || !otp) return res.status(400).json({ message: 'Token et OTP requis' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'inactivity' || decoded.otp !== otp) {
      return res.status(400).json({ message: 'Code OTP incorrect' });
    }
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    user.lastSeen = new Date();
    await user.save();
    await sendLoginAlertEmail(user, req, user.email);

    const authToken = generateToken({ id: user._id });

    return res.json({
      message: 'Connexion réussie après vérification',
      id: user._id, username: user.username, email: user.email, token: authToken,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(400).json({ message: 'Code expiré' });
    return res.status(400).json({ message: 'Token invalide' });
  }
};

// ========================================
// 6. GET CURRENT USER
// ========================================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// ========================================
// 7. FORGOT PASSWORD
// ========================================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const otp = generateOtp();
    const token = generateToken({ userId: user._id, otp, type: 'reset' }, '10m');
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    const html = `
      <div style="font-family:Arial;text-align:center;padding:30px;background:#f9ee34;border-radius:12px;">

  <h2 style="color:#000;">Réinitialisez votre mot de passe</h2>

  <h1 style="
    font-size:38px;
    letter-spacing:10px;
    color:#fff;             /* CODE EN BLANC */
    background:#000;        /* FOND NOIR POUR CONTRASTE */
    padding:15px;
    border-radius:10px;
    display:inline-block;
  ">
    ${otp}
  </h1>

  <p style="color:#555;margin:20px 0;">Valable 10 minutes</p>

  <a href="${resetUrl}" style="
    background:#000;        /* BOUTON NOIR */
    color:#fff;             /* TEXTE BLANC */
    padding:12px 24px;
    text-decoration:none;
    border-radius:8px;
    font-weight:bold;
    display:inline-block;
  ">
    Réinitialiser
  </a>

</div>

    `;
    await sendEmail(email, 'Réinitialisation - Owly', `Code: ${otp}`, html);
    return res.json({ message: 'OTP envoyé', token });
  } catch (err) {
    console.error('ERREUR FORGOT PASSWORD:', err.message);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};



// 8. VÉRIFIER OTP RESET + CONFIRMATION NOUVEAU MOT DE PASSE


export const verifyOtpReset = async (req, res) => {
  const { token, otp, newPassword, newPasswordConfirm } = req.body;

  // Vérification des champs obligatoires
  if (!token || !otp || !newPassword || !newPasswordConfirm) {
    return res.status(400).json({ message: 'Tous les champs sont requis (token, otp, nouveau mot de passe et confirmation)' });
  }

  // Confirmation que les deux mots de passe sont identiques
  if (newPassword !== newPasswordConfirm) {
    return res.status(400).json({ message: 'Les deux mots de passe ne correspondent pas.' });
  }

  // Tu avais une règle de longueur = 8 exactement → je la garde pour compatibilité
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'reset' || decoded.otp !== otp) {
      return res.status(400).json({ message: 'Code OTP incorrect' });
    }
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.lastSeen = new Date();
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    return res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(400).json({ message: 'Code expiré' });
    return res.status(400).json({ message: 'Token invalide' });
  }
};