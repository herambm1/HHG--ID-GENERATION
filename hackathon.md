## HH Goa 2026: Frame & ID Card

## Generator Implementation Guide

## 1. Project Overview

This project is a mobile-optimized, lightning-fast web application designed for the Hacker

House Goa 2026 shortlisting task. It allows users to upload a photo and instantly generate either a branded PFP Frame (Format A) or a Builder ID Card (Format B). The generated image can be downloaded or shared directly to X (formerly Twitter) with a pre-filled caption and the mandatory #FrameInGoa hashtag.

## Key Requirements Addressed:

- No login or signup required.

- Sub-2-second, near-instant image generation.

- Mobile-first, responsive layout.

- Native support for iOS .heic images.

- Working X (Twitter) share flow with accurate Open Graph (OG) image previews.

## 2. Tech Stack Selection

To achieve maximum performance and handle X's specific metadata requirements, we are

utilizing a modern, serverless React stack:

## Frontend Layer

- Framework: Next.js 14 (App Router) - Required for dynamic Open Graph (OG) metadata to make the Twitter link previews work.

- Language: JAVA Script - For robust, error-free code.

- Styling: Tailwind CSS - For rapid, on-brand styling mimicking the provided poster aesthetics.

- Animations: Framer Motion - To provide smooth, app-like transitions without loading screens.

## Image Processing (Client-Side)

- Core Engine: HTML5 <canvas> API - Performs all image merging and text rendering directly in the user's browser for instant results.

- Cropping Engine: react-easy-crop - Allows users to easily scale and position their photos into the required frames.

- HEIC Conversion: heic2any - Crucial for intercepting iPhone uploads and converting them to browser-readable formats on the fly.


## Storage & Sharing

- Image Hosting: Vercel Blob (or Supabase Storage) - Temporarily stores the generated image to serve it to Twitter's crawlers.

- Deployment: Vercel - Provides seamless Next.js integration and edge network speed.

## 3. Application Data Flow

## Step 1: Upload & Format Selection

- 1. The user lands on the homepage and selects either "PFP Frame" or "Builder ID".

- 2. The user taps "Upload Photo". The system accepts standard web formats plus .heic.

- 3. If an .heic file is detected, heic2any converts it to a standard .jpeg Blob in the background.

## Step 2: Customization

- 1. The user is presented with a cropping interface (react-easy-crop) to perfectly align their face.

- 2. The application must detect the user's face and automatically set an initial crop/zoom that keeps the face centered and visible. The user can then freely adjust the crop, zoom, and position as needed.

- 3. For Format B only: The user fills in text inputs for their Name and Stack/Role. If left blank, a fallback "Builder Title" is randomly generated (e.g., "Based Dev", "Ship-oor").

## Step 3: Instant Canvas Generation

The user is presented with multiple pre-defined HH Goa 2026 canvas designs for the

selected format and can choose their preferred design.

The user can choose Randomize to automatically select a canvas design from the

available options.

A hidden HTML5 <canvas> is initialized with the required dimensions (e.g., 1080×1080

for PFP and 1080×1350 for ID Card).

The selected canvas design is rendered in layers:

- Official HH Goa background layer

- User's cropped photo placed in the designated transparent/photo area

- Branded foreground frame/graphics

- User-provided text using the custom brand fonts

The completed canvas is immediately exported as an image (e.g., Base64/Data URL or

Blob) and the UI updates instantly to display the final generated graphic.

## 1. Canvas Selection

## 2. Randomize Option

## 3. Canvas Initialization

## 4. Layered Canvas Rendering

## 5. Instant Export


## Step 4: Export & Twitter Integration

- 1. Download: Clicking "Download" triggers a standard HTML <a> tag with a download attribute, saving the image to the user's device.

- The application uploads the Base64 image to Vercel Blob, receiving a unique image ID.

- The app redirects the user to the Twitter Web Intent URL: https://twitter.com/intent/tweet?text=Catch%20me%20building%20at%20Hacker%20 House%20Goa!%20%23FrameInGoa&url=https://[YOUR_DOMAIN]/share/[ID]

- Twitter's bot crawls the provided /share/[ID] link. Our Next.js backend dynamically injects the <meta property="og:image"> tags pointing to the Vercel Blob URL, resulting in a beautiful rich preview on the user's timeline.

## 2. Share to X:

## 4. UI/UX & Brand Alignment

The visual design is strictly derived from image_9b86fd.jpg to ensure it feels like an authentic

extension of the event.

- Primary Background: Deep Forest Green (#1B6B44)

- Primary Accents: Vibrant Yellow (#FFD500) and Neon Pink (#FF007F)

- Text: White and Yellow

- Headers: Condensed serif (e.g., Playfair Display or Onyx) to match the "HACKER HOUSE" poster text.

- Subtitles: Clean sans-serif (e.g., Inter) or retro pixel font mimicking "2:47PM STUDIO".

- Vibe: Minimalist, tropical, and heavily leaning into web3/hacker culture. Buttons will feature sharp, solid-color drop shadows (brutalism).

## Color Palette:

## Typography:

## 5. Technical Implementation Details

## Canvas Rendering Logic (Example)

const generateFinalImage = async (croppedUserImage, name, role, format) => {

const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');

canvas.width = 1080;

canvas.height = format === 'A' ? 1080 : 1350;

// Draw base template

const template = await loadImage(format === 'A' ? '/frame-a.png' : '/frame-b.png');


```
ctx.drawImage(template, 0, 0);
// Draw user image beneath frame (using globalCompositeOperation if needed)
ctx.drawImage(croppedUserImage, x, y, width, height);
// Draw dynamic text for Builder ID
if (format === 'B') {
ctx.fillStyle = '#FFD500';
ctx.font = 'bold 72px "Playfair Display"';
ctx.textAlign = 'center';
ctx.fillText(name.toUpperCase(), canvas.width / 2, 1000);
ctx.fillStyle = '#FFFFFF';
ctx.font = '40px "Inter"';
ctx.fillText(role, canvas.width / 2, 1100);
}
return canvas.toDataURL('image/png');
};
```

## Next.js Dynamic Metadata (For X Sharing)

```
To ensure the image preview works on X, we use Next.js generateMetadata in
app/share/[id]/page.tsx:
import { Metadata } from 'next';
export async function generateMetadata({ params }): Promise<Metadata> {
const imageId = params.id;
const ogImageUrl = `https://your-blob-storage.com/${imageId}.png`;
return {
title: "My HH Goa 2026 Builder Profile",
description: "Join me at Hacker House Goa! #FrameInGoa",
openGraph: {
images: [{ url: ogImageUrl, width: 1080, height: 1080 }],
},
twitter: {
card: 'summary_large_image',
images: [ogImageUrl],
```


},

};

}

## 6. Critical Edge Cases & Solutions

- 1. HEIC Compatibility: Most iOS users will upload .heic files, which crash standard HTML canvas implementations. We proactively catch this MIME type on upload and process it via heic2any before the crop stage.

- 2. Twitter Image Limitations: Twitter's share intent API does not allow developers to attach raw image files directly from a web app. By instantly uploading the generated image to a temporary blob storage and passing a rich-metadata URL to the intent, we bypass this limitation seamlessly.

- 3. Variable Photo Sizes: Users will upload ultra-wide landscapes and tall portraits. react-easy-crop forces the user into our required aspect ratio prior to rendering, preventing stretched or distorted output.
