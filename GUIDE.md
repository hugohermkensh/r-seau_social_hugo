# 🚀 Réseau Potes - Guide Utilisateur

## 📱 Réseau Social Privé 100% Local

Bienvenue sur **Réseau Potes**, votre réseau social privé conçu pour rester entre amis, avec toutes les données stockées localement et en toute sécurité.

---

## ✨ Fonctionnalités Principales

### 🔐 **Authentification Sécurisée**
- **Connexion simple** : Pseudo + Code d'accès (minimum 4 caractères)
- **Création automatique** : Si ton pseudo n'existe pas, un compte est créé
- **Stockage local** : Toutes les données restent sur ta machine
- **Validation robuste** : Protection contre les injections et erreurs

### 📰 **Fil d'Actualité (Feed)**
- **Publications** : Partage du texte jusqu'à 1000 caractères
- **Likes** : Réagis aux posts de tes amis
- **Commentaires** : Commente avec validation (500 caractères max)
- **Suppression** : Supprime tes propres posts
- **Temps réel** : Affichage automatique des timestamps formatés

### 📖 **Stories (24h)**
- **Création** : Stories texte ou image (280 caractères max)
- **Visualisation** : Interface plein écran avec progression automatique
- **Expiration** : Disparaissent après 24h automatiquement
- **Indicateurs** : Cercles avec glow pour les nouvelles stories
- **Suivi** : Vois qui a vu tes stories

### 💬 **Messagerie Privée**
- **Conversations** : Messages privés entre utilisateurs
- **Temps réel** : Envoi et réception instantanés
- **Notifications** : Badge avec nombre de messages non lus
- **Historique** : Toutes les conversations sauvegardées
- **Limite** : 2000 caractères par message

### 📅 **Calendrier Partagé**
- **Événements** : Crée et partage des événements avec le groupe
- **Participation** : Indique ta présence en un clic
- **Détails complets** : Titre, description, date, heure, lieu
- **Organisation** : Vue groupée par mois
- **Gestion** : Supprime tes propres événements

### 👤 **Profil Utilisateur**
- **Personnalisation** : Modifie ton pseudo et ta bio
- **Statistiques** : Vois tes posts, likes reçus, commentaires
- **Historique** : Tous tes posts en un coup d'œil
- **Avatar** : Initiales personnalisées avec gradient futuriste

---

## 🎨 Design Futuriste

### Thème Bleu/Noir
- **Couleurs néon** : Bleu électrique (#00A3FF) et cyan (#00FFE0)
- **Effets visuels** : Glassmorphism, glow effects, animations fluides
- **Gradients** : Dégradés lumineux pour les éléments interactifs
- **Scrollbar** : Personnalisée avec couleurs du thème
- **Animations** : Pulse glow, slide-up, fade-in

### Responsive Design
- **Mobile-first** : Interface optimisée pour tous les écrans
- **Navigation** : Barre fixe en bas pour accès rapide
- **Adaptabilité** : Conversations, stories, tout s'adapte

---

## 🔒 Sécurité & Validation

### Validation des Entrées
Toutes les entrées utilisateur sont validées avec **Zod** :

1. **Authentification**
   - Pseudo : 2-20 caractères, alphanumériques + tirets
   - Code : 4-50 caractères minimum

2. **Publications**
   - Posts : 1-1000 caractères
   - Commentaires : 1-500 caractères
   - Stories : 1-280 caractères

3. **Messages**
   - Contenu : 1-2000 caractères
   - Trim automatique des espaces

4. **Événements**
   - Titre : 1-100 caractères
   - Description : 0-500 caractères
   - Date : Validation futur uniquement
   - Lieu : 0-200 caractères

### Protection
- **Sanitization** : Suppression des balises HTML dangereuses
- **XSS Prevention** : Pas de `dangerouslySetInnerHTML`
- **Type Safety** : TypeScript pour éviter les erreurs
- **Error Handling** : Messages d'erreur clairs et informatifs

---

## 💾 Stockage Local

### Structure des Données
Tout est stocké dans `localStorage` avec préfixe `reseau_potes_` :

- **Users** : Profils utilisateurs avec bio, pseudo, code hashé
- **Posts** : Publications avec likes, commentaires, timestamps
- **Stories** : Stories éphémères avec expiration 24h
- **Messages** : Conversations privées avec statut de lecture
- **Events** : Événements avec participants et détails
- **Current User** : Session utilisateur courante

### Gestion Automatique
- **Expiration** : Les stories disparaissent après 24h
- **Nettoyage** : Données expirées supprimées automatiquement
- **Validation** : Toutes les données validées avant stockage
- **Backup** : Possibilité d'export/import (à venir)

---

## 🚀 Utilisation

### 1️⃣ Première Connexion
```
1. Lance l'application
2. Entre ton pseudo (ex: "Alex")
3. Crée un code (ex: "demo1234")
4. Clique sur "Se connecter"
→ Ton compte est créé automatiquement !
```

### 2️⃣ Créer du Contenu
```
• Post : Écris dans la zone de texte du feed
• Story : Clique sur ton avatar avec le "+"
• Message : Va dans Messages et sélectionne un contact
• Événement : Calendrier → Bouton "Événement"
```

### 3️⃣ Interagir
```
• Like : Clique sur le cœur d'un post
• Commenter : Clique sur l'icône commentaire
• Voir story : Clique sur un cercle d'avatar
• Participer : Événement → "Participer"
```

### 4️⃣ Personnaliser
```
• Profil : Icône utilisateur → Bouton éditer
• Modifie ton pseudo et ta bio
• Vois tes statistiques en temps réel
```

---

## ⚙️ Fonctionnalités Techniques

### Timestamps Intelligents
- "À l'instant" (< 1 min)
- "Il y a X min" (< 60 min)
- "Il y a Xh" (< 24h)
- "Il y a Xj" (< 7j)
- Date complète (> 7j)

### Notifications
- Badge sur l'icône Messages pour les non-lus
- Toast notifications pour les actions importantes
- Feedback visuel immédiat

### Navigation
- **Home** : Fil d'actualité
- **Messages** : Messagerie privée
- **Calendar** : Événements partagés
- **Profile** : Ton profil

---

## 🎯 Prochaines Fonctionnalités

### Phase 2 (À venir)
- [ ] Upload d'images pour posts et stories
- [ ] Thème alternatif Jaune/Orange
- [ ] Carte de géolocalisation
- [ ] Swipe Battle (mini-jeu)
- [ ] Appels audio/vidéo WebRTC
- [ ] Export/Import des données
- [ ] Backup automatique
- [ ] Mode hors-ligne

---

## 🛠️ Technologies Utilisées

- **Frontend** : React 18 + TypeScript
- **Routing** : React Router v6
- **UI** : Shadcn/ui + Tailwind CSS
- **Validation** : Zod
- **Storage** : LocalStorage
- **Icons** : Lucide React
- **Toasts** : Sonner

---

## 📊 Limites Actuelles

- **Stockage** : Limité par la capacité du localStorage (~5-10MB)
- **Images** : Structure prête, upload à implémenter
- **Vidéos** : Non supporté pour le moment
- **Multi-device** : Pas de synchronisation (données locales)
- **Backup** : Manuel via export du localStorage

---

## 🤝 Contribuer

### Comptes de Démo
Utilisateurs pré-créés pour tester :
- **Alex** / code: `demo1234`
- **Sarah** / code: `demo1234`
- **Tom** / code: `demo1234`
- **Emma** / code: `demo1234`

### Développement Local
```bash
# Installation
npm install

# Lancement
npm run dev

# Build production
npm run build
```

---

## 🐛 Résolution de Problèmes

### Je ne peux pas me connecter
→ Vérifie que ton code fait au moins 4 caractères

### Mes stories ne s'affichent pas
→ Elles expirent après 24h, crée-en une nouvelle

### Mes messages ne partent pas
→ Vérifie la connexion et la longueur du message (max 2000)

### L'app est lente
→ Vide le localStorage si trop de données accumulées

### Reset complet
```javascript
// Dans la console navigateur
localStorage.clear()
// Puis rafraîchir la page
```

---

## 📜 Licence

Projet open-source pour usage privé entre amis.
Toutes les données restent locales et privées.

---

## 💡 Astuces

1. **Pseudo unique** : Choisis un pseudo différent des autres
2. **Code sécurisé** : Utilise un code complexe (12+ caractères)
3. **Bio fun** : Personnalise ta bio avec emojis
4. **Stories régulières** : Garde le contact avec des stories quotidiennes
5. **Événements** : Planifie vos sorties à l'avance
6. **Commentaires** : Interagis avec les posts de tes potes
7. **Messages** : Conversations privées pour les sujets perso

---

**Profite bien de ton réseau privé ! 🎉**
