# 🚀 Production Deployment Guide: CrimeAtlas 3.0

Follow these steps to deploy your full-stack application to **Render** (API) and **Vercel** (Frontend).

---

## 1. Deploy the API to Render (Python Flask)

Render will host your machine learning models and prediction engine.

1.  **Log in** to [render.com](https://render.com).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository: `https://github.com/Vansh-engg/CrimeAtlas3.0`.
4.  **Configure the Service**:
    *   **Name**: `crime-atlas-api`
    *   **Region**: Select the one closest to you.
    *   **Environment**: `Python 3`
    *   **Build Command**: `pip install -r backend/requirements.txt`
    *   **Start Command**: `cd backend && gunicorn -w 1 -b 0.0.0.0:$PORT app:app`
5.  **Advanced settings**:
    *   No specific environment variables are required unless you've added local secrets.
6.  Click **Create Web Service**.
7.  **Wait for deployment** to finish. Once live, copy the URL (e.g., `https://crime-atlas-api.onrender.com`).

---

## 2. Deploy the Frontend to Vercel (Next.js)

Vercel will host your user interface and dashboard.

1.  **Log in** to [vercel.com](https://vercel.com).
2.  Click **Add New...** -> **Project**.
3.  Import the repository `https://github.com/Vansh-engg/CrimeAtlas3.0`.
4.  **Configure the Project**:
    *   **Framework Preset**: `Next.js`
    *   **Root Directory**: (Leave blank - root)
    *   **Build & Output Settings**: Defaults are fine.
5.  **Environment Variables**:
    *   Add a new environment variable:
        *   **Key**: `NEXT_PUBLIC_API_URL`
        *   **Value**: Paste your Render API URL (e.g., `https://crime-atlas-api.onrender.com`)
6.  Click **Deploy**.

---

## 3. Verify the Deployment

Once both services are live:

1.  Open your **Vercel URL**.
2.  Navigate to the **Prediction** page.
3.  Try to generate a crime forecast.
    *   If it works, the frontend is successfully communicating with the Render backend!
    *   If it fails, check the **Browser Console** (F12) for CORS errors or the **Render Logs** to see if the request reached the server.

---

## 💡 Pro-Tips for Production
- **Cold Boot**: If you are using Render's *Free Tier*, the API will "sleep" after 15 minutes of inactivity. The first prediction after a break might take up to 30 seconds to load while the server spins up.
- **CORS**: The `backend/app.py` currently has `CORS(app)` which allows all origins. This is fine for initial deployment, but you can restrict it to your Vercel URL later for better security.
- **Data Updates**: Since the app uses a CSV file in the `Data/` folder, simply update the CSV in GitHub and both services will pick up the new data on their next redeploy.
