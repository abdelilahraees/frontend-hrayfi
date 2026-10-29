# Hrayfi — Frontend (Angular 20)

Plateforme qui met en relation des clients et des artisans au Maroc.
Ce dépôt contient l'interface web ; l'API est dans `hrayfi-backend`.

## Fonctionnalités

| Profil | Ce qu'il peut faire |
| --- | --- |
| Visiteur | Rechercher et filtrer les annonces (mot-clé, métier, ville, note minimum, budget, tri), voir les photos, les prix et les avis, consulter l'annuaire et le profil des artisans |
| Client | S'inscrire / se connecter, noter et commenter une annonce, discuter avec un artisan et négocier le prix (offres et contre-offres), réserver au prix convenu, suivre ses demandes, évaluer une intervention terminée |
| Artisan | S'inscrire / se connecter, publier des annonces avec photos, les modifier, masquer ou supprimer, accepter / refuser / clôturer les demandes, répondre aux messages, suivre ses statistiques |

Messages et notifications arrivent en temps réel (STOMP over WebSocket).

## Pages

| Route | Page |
| --- | --- |
| `/annonces`, `/services/:categorie` | Recherche et filtres |
| `/annonces/:id` | Détail d'une annonce, avis, contact, demande d'intervention |
| `/artisans`, `/artisans/:id` | Annuaire et profil public |
| `/login`, `/register` | Connexion, inscription client ou artisan (`?profil=artisan`) |
| `/espace/client` | Tableau de bord client |
| `/espace/artisan` | Tableau de bord artisan (annonces, demandes reçues) |
| `/espace/artisan/annonces/nouvelle` | Publier une annonce avec photos |
| `/espace/profil` | Modifier son profil |
| `/messages`, `/messages/:userId` | Messagerie et négociation |

## Démarrer

1. Lancer le backend (voir son README) sur `http://localhost:8080`.
   L'adresse se change dans `src/app/core/api.config.ts`.
2. Installer et lancer le front :

```bash
npm install
```

```bash
npm start
```

Puis ouvrir `http://localhost:4200`.

Avec `SEED_DEMO=true` côté backend, ces comptes existent (mot de passe `password123`) :
`client.demo@hrayfi.ma` (client) et `artisan.demo@hrayfi.ma` (artisan plombier).

## Structure

```
src/app/
  core/        session JWT, intercepteur, guards, services API, client temps réel, modèles
  pages/       une page par route (chargée à la demande)
  components/  sections de l'accueil, en-tête, pied de page
  ui/          composants réutilisables (étoiles, carte d'annonce, pagination…)
```

## Commandes

```bash
npm run build
```

```bash
npm test
```
