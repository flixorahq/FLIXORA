FLIXORA starter — setup notes

IMPORTANT
- This is a starter project, not a live configured website.
- Use only movies/videos and download links you own or are legally authorized to distribute.
- Sponsored links must be clearly identified. The download flow opens up to two optional sponsored links in a new tab, then opens the final link. Visitors can return normally; no forced redirects or back-button trapping.
- Never paste passwords, Firebase service-account keys, or private secrets into HTML/JS files.

1) Create a Firebase project at https://console.firebase.google.com/
2) Add a Web App and copy its config into firebase-config.js.
3) Enable Authentication → Email/Password. Create your admin account there.
   Firebase uses email/password by default. For a username-style login, use an email alias for the admin account; do not store a plain-text password in the website.
4) Create a Cloud Firestore database.
5) In firestore.rules, replace REPLACE_WITH_YOUR_ADMIN_EMAIL with the exact admin email, then publish the rules.
6) Create a collection named "movies". You can add movies from admin.html after signing in.
7) Upload these files to a GitHub repository. In repository Settings → Pages, deploy from the main branch / root.
8) Open the published site URL. Test on your phone.

Thumbnail note:
This starter currently accepts an image URL. Direct gallery uploads need Firebase Storage plus Storage security rules; that can be added after the Firebase project is configured. Do not put an unrestricted upload endpoint on a public site.

Admin access:
The admin page is separate at /admin.html, but its security comes from Firebase Authentication and Firestore rules, not from the URL being hidden.
