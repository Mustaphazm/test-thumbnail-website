"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"

export default function YouTubeThumbnailDownloader() {
  // State for UI elements
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState("fr") // Default state set to French initially
  const [showResults, setShowResults] = useState(false)
  const [currentModal, setCurrentModal] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
 
  // Refs
  const videoUrlInputRef = useRef<HTMLInputElement>(null)
  const thumbnailsGridRef = useRef<HTMLDivElement>(null)

  // Initialize on component mount
  useEffect(() => {
    // Set current year in footer
    const currentYearSpan = document.getElementById("currentYear")
    if (currentYearSpan) {
      currentYearSpan.textContent = new Date().getFullYear().toString()
    }

    // Check dark mode preference
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)")
    const currentMode = localStorage.getItem("darkMode")

    if (currentMode === "enabled" || (currentMode === null && prefersDarkScheme.matches)) {
      setDarkMode(true)
      document.body.classList.add("dark-mode")
    }

    // Load saved language or determine default (FALLBACK TO FRENCH)
    const browserLang = navigator.language.split("-")[0]
    const savedLang = localStorage.getItem("selectedLanguage")
    const initialLang = savedLang || browserLang || "fr" // Prioritize saved, then browser, then French
    const validLang = translations[initialLang as keyof typeof translations] ? initialLang : "fr" // Ensure it's a valid language, else French

    setLanguage(validLang)

    // Set HTML lang attribute
    document.documentElement.setAttribute("lang", validLang)

    // Translate page on initial load
    translatePage(validLang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const initialTranslationSet = translations[validLang as keyof typeof translations] || translations.en;
    // Use a more descriptive default title matching metadata if translation missing
    document.title = initialTranslationSet.siteTitle
     || 'Free YouTube Thumbnail Downloader (HD, SD, HQ) - Easy & Fast';

  }, []) // Dependency array left empty to run only once on mount

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)

    if (newDarkMode) {
      document.body.classList.add("dark-mode")
      localStorage.setItem("darkMode", "enabled")
    } else {
      document.body.classList.remove("dark-mode")
      localStorage.setItem("darkMode", "disabled")
    }
  }

  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value
    setLanguage(selectedLang)
    localStorage.setItem("selectedLanguage", selectedLang)

    // Set HTML lang attribute
    document.documentElement.setAttribute("lang", selectedLang)

    // Translate page
    translatePage(selectedLang)

    // Show feedback (Use English for the feedback message structure itself for simplicity,
    // but get the language name from the option text)
    const langName = e.target.options[e.target.selectedIndex].text
    displayFeedback(`Language changed to ${langName}.`, 3000, false) // false: don't treat this specific message as a translation key
  }

  // Display feedback message
  const displayFeedback = (message: string, duration = 3000, isTranslationKey = false) => {
    let finalMessage = message
    if (isTranslationKey) {
      const translationSet = translations[language as keyof typeof translations] || translations.en // Fallback to English if current language set is broken
      // Fallback chain: Current Language -> English -> Original Key
      finalMessage =
        translationSet[message as keyof typeof translationSet] ||
        translations.en[message as keyof typeof translations.en] ||
        message
    }

    setFeedbackMessage(finalMessage)
    setShowFeedback(true)

    setTimeout(() => {
      setShowFeedback(false)
    }, duration)
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        displayFeedback("feedbackCopied", 3000, true)
      } else {
        // Fallback for insecure contexts or older browsers
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "absolute"
        textArea.style.left = "-9999px"
        document.body.appendChild(textArea)
        textArea.select()

        try {
          document.execCommand("copy")
          displayFeedback("feedbackCopied", 3000, true)
        } catch (err) {
          console.error("Fallback copy failed: ", err)
          displayFeedback("feedbackCopyFail", 4000, true)
        }

        document.body.removeChild(textArea)
      }
    } catch (err) {
      console.error("Clipboard API failed: ", err)
      displayFeedback("feedbackCopyFail", 4000, true)
    }
  }

  // Get YouTube thumbnails
  const getYouTubeThumbnail = (url: string) => {
    // Improved Regex to handle various YouTube URL formats including shorts
    const regExp =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = url.match(regExp)

    if (thumbnailsGridRef.current) {
      thumbnailsGridRef.current.innerHTML = "" // Clear previous results
    }

    setShowResults(false) // Hide results initially

    if (match && match[1]) {
      const videoID = match[1]
      const thumbnailBaseUrl = "https://img.youtube.com/vi/" // Use HTTPS

      setShowResults(true) // Show results section

      // Get localized resolution names (with fallback to English)
      const currentLang = language
      const translationSet = translations[currentLang as keyof typeof translations] || translations.en

      const resolutionNames = {
        maxresdefault: translationSet.resMaxHd || translations.en.resMaxHd,
        sddefault: translationSet.resSd || translations.en.resSd,
        hqdefault: translationSet.resHq || translations.en.resHq,
        mqdefault: translationSet.resMq || translations.en.resMq,
      }

      const options = [
        { resolutionKey: "resMaxHd", code: "maxresdefault" },
        { resolutionKey: "resSd", code: "sddefault" },
        { resolutionKey: "resHq", code: "hqdefault" },
        { resolutionKey: "resMq", code: "mqdefault" },
      ]

      let foundAny = false

      options.forEach((option) => {
        const thumbnailUrl = `${thumbnailBaseUrl}${videoID}/${option.code}.jpg`
        const resolutionText = resolutionNames[option.code as keyof typeof resolutionNames]

        // Create thumbnail option element dynamically
        const optionDiv = document.createElement("div")
        optionDiv.className = "thumbnail-option"
        optionDiv.classList.add("thumb-" + option.code)

        const imgContainer = document.createElement("div")
        imgContainer.className = "img-container"

        const img = document.createElement("img")
        img.src = thumbnailUrl
        img.alt = `Thumbnail for ${videoID} - ${resolutionText}`
        img.loading = "lazy" // Lazy load images

        let imageLoadedSuccessfully = false
        img.onload = () => {
          foundAny = true
          imageLoadedSuccessfully = true
          // Ensure card is visible if it loaded (might have been hidden by error briefly)
          optionDiv.style.display = ""
        }

        img.onerror = () => {
          console.warn(`Thumbnail not found or failed to load: ${resolutionText} (${thumbnailUrl})`)
          img.classList.add("img-error") // Add error class for potential styling

          // Use a slight delay to check if load event fired, then hide if it didn't.
          // Maxresdefault should always remain visible even if it fails, to indicate it was attempted.
          if (option.code !== "maxresdefault") {
            setTimeout(() => {
              if (!imageLoadedSuccessfully) {
                optionDiv.style.display = "none" // Hide failed non-maxres cards
                // Check if this was the *last* visible card being hidden
                checkIfAnyThumbnailsVisible()
              }
            }, 100) // Short delay
          } else {
            // If maxres fails, still check if other thumbs are visible later
             setTimeout(checkIfAnyThumbnailsVisible, 100);
          }
        }

        imgContainer.appendChild(img)

        const resTextP = document.createElement("p")
        resTextP.className = "resolution-text"
        resTextP.textContent = resolutionText

        const buttonGroup = document.createElement("div")
        buttonGroup.className = "button-group"

        // Download Button
        const downloadLink = document.createElement("a")
        downloadLink.href = thumbnailUrl
        downloadLink.textContent = translationSet.downloadBtn || translations.en.downloadBtn // Fallback text
        downloadLink.className = "btn btn-secondary"
        downloadLink.setAttribute("download", `thumbnail_${videoID}_${option.code}.jpg`)
        downloadLink.setAttribute("target", "_blank") // Open in new tab for download
        downloadLink.setAttribute("rel", "noopener noreferrer")

        // Copy URL Button
        const copyButton = document.createElement("button")
        copyButton.textContent = translationSet.copyUrlBtn || translations.en.copyUrlBtn // Fallback text
        copyButton.className = "btn btn-copy"
        copyButton.onclick = () => copyToClipboard(thumbnailUrl)

        buttonGroup.appendChild(downloadLink)
        buttonGroup.appendChild(copyButton)

        optionDiv.appendChild(imgContainer)
        optionDiv.appendChild(resTextP)
        optionDiv.appendChild(buttonGroup)

        if (thumbnailsGridRef.current) {
          thumbnailsGridRef.current.appendChild(optionDiv)
        }
      })

      // Function to check visibility after potential errors hide cards
      const checkIfAnyThumbnailsVisible = () => {
         if (thumbnailsGridRef.current) {
            const visibleCards = thumbnailsGridRef.current.querySelectorAll('.thumbnail-option:not([style*="display: none"])');
            if (visibleCards.length === 0) {
                // Only show error if foundAny is also false (meaning onload never fired for any image)
                // or if all cards were added but immediately hidden.
                if (!foundAny || (thumbnailsGridRef.current.childElementCount > 0 && visibleCards.length === 0)) {
                    displayFeedback("feedbackLoadError", 5000, true);
                    setShowResults(false);
                }
            }
        }
      }


      // Initial check after a delay to allow images time to load/error out
      setTimeout(checkIfAnyThumbnailsVisible, 1500); // Check after images have had time to load/error

      // Clear input after successful processing
      if (videoUrlInputRef.current) {
        videoUrlInputRef.current.value = ""
      }
    } else {
      displayFeedback("feedbackInvalidUrl", 4000, true)
      setShowResults(false) // Ensure results are hidden on invalid URL
    }
  }

  // Handle download button click
  const handleDownloadClick = () => {
    if (videoUrlInputRef.current) {
      const url = videoUrlInputRef.current.value.trim()
      if (url) {
        getYouTubeThumbnail(url)
      } else {
        displayFeedback("feedbackNoUrl", 3000, true) // Show feedback if input is empty
      }
    }
  }

  // Handle modal open/close
  const openModal = (modalId: string) => {
    setCurrentModal(modalId)
  }

  const closeModal = () => {
    setCurrentModal(null)
  }

  // Translate page based on language state
const translatePage = (lang: string) => {
  const translationSet = translations[lang as keyof typeof translations] || translations.en; // Fallback to English

  document.querySelectorAll("[data-translate]").forEach((element) => {
      const key = element.getAttribute("data-translate");
      let translation = `[${key}]`; // Default fallback text

      if (key && translationSet[key as keyof typeof translationSet]) {
          translation = translationSet[key as keyof typeof translationSet];
      } else if (key && translations.en[key as keyof typeof translations.en]) {
          // Fallback to English text if key exists but translation is missing
          translation = translations.en[key as keyof typeof translations.en];
          console.warn(`Translation missing for key: ${key} in language: ${lang}, using English fallback.`);
      } else if (key){
           console.warn(`Translation missing for key: ${key} in language: ${lang} and English.`);
      }

      // *** CHANGE THIS PART ***
      // Use innerHTML to render HTML tags from the translation string
      if (element instanceof HTMLElement) { // Type check for safety
           element.innerHTML = translation;
      } else {
          // Fallback for elements that aren't HTMLElement (less common)
          element.textContent = translation;
      }
      // *** END OF CHANGE ***
  });

  // Placeholder translation (remains the same as it targets input placeholders)
  document.querySelectorAll("[data-translate-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-translate-placeholder");
      if (key && translationSet[key as keyof typeof translationSet] && element instanceof HTMLInputElement) {
          element.placeholder = translationSet[key as keyof typeof translationSet];
      } else if (key && element instanceof HTMLInputElement) {
          element.placeholder = translations.en[key as keyof typeof translations.en] || `[${key}]`;
          console.warn(`Placeholder translation missing for key: ${key} in language: ${lang}`);
      }
  });

  // Special case for structured list items (remains the same, usually no HTML needed here)
  document.querySelectorAll("[data-translate^='step'], [data-translate$='cont']").forEach((element) => {
     const key = element.getAttribute("data-translate")
     if (key && translationSet[key as keyof typeof translationSet]) {
         element.textContent = translationSet[key as keyof typeof translationSet]
     } else if (key) {
         element.textContent = translations.en[key as keyof typeof translations.en] || ""
         console.warn(`Partial translation missing for key: ${key} in language: ${lang}`)
     }
  });
}

   // Add useEffect hook to re-translate when language changes
   useEffect(() => {
        translatePage(language);
    }, [language]); // Re-run translation when language state changes

  // Handle key press in input field (Enter key)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleDownloadClick()
    }
  }

  // ----- JSX Structure -----
  return (
    <>
      {/* Feedback Message Area */}
      <div id="feedbackMessage" className={`feedback-message ${showFeedback ? "show" : ""}`}>
        {feedbackMessage}
      </div>

      <header className="container">
        <div className="logo-area">
          {/* Title will be translated by data-translate */}
          <h1 data-translate="siteTitle">YouTube Thumbnail Downloader</h1>
        </div>
        <div className="controls">
          {/* Language Selector */}
          <div className="language-select">
            <select id="languageSelector" aria-label="Select Language" value={language} onChange={handleLanguageChange}>
              {/* Keep option text in English for simplicity, value is the key */}
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="ru">Русский</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
              <option value="ko">한국어</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
          {/* Dark Mode Toggle */}
          <div className="dark-mode-toggle" aria-label="Toggle dark mode" role="switch" aria-checked={darkMode}>
            <span data-translate="modeLabel">Mode</span>
            <label className="switch">
              <input type="checkbox" id="darkModeCheckbox" checked={darkMode} onChange={toggleDarkMode} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Intro Section */}
        <section className="intro">
          <h2 data-translate="mainHeadline">Downloader YouTube Thumbnail</h2>
          <p data-translate="introParagraph">
            Quickly download any YouTube video's thumbnail...
          </p>
        </section>

        {/* Input Area */}
        <section className="input-area">
          <input
            type="text"
            id="videoUrlInput"
            ref={videoUrlInputRef}
            placeholder="Paste YouTube video URL..." // Placeholder translated by data-translate-placeholder
            aria-label="YouTube Video URL"
            data-translate-placeholder="urlPlaceholder"
            onKeyPress={handleKeyPress} // Handle Enter key press
          />
          <button
            className="btn btn-primary"
            id="downloadBtnMain" // Changed ID to avoid conflict with dynamically generated ones
            data-translate="getThumbnailsBtn"
            onClick={handleDownloadClick}
          >
            Get Thumbnails
          </button>
        </section>

        {/* Thumbnail Results Area */}
        <section id="thumbnailResults" className={showResults ? "" : "hidden"}>
          <h2 data-translate="resultsTitle">Available Thumbnails</h2>
          {/* Grid where thumbnails will be dynamically inserted */}
          <div className="thumbnails-grid" id="thumbnailsGrid" ref={thumbnailsGridRef}>
            {/* Thumbnails will be inserted here by JavaScript */}
          </div>
        </section>

        {/* How to Use Section */}
        <section className="content-section enhanced">
            <h2 data-translate="howToTitle">How to Use This Tool</h2>
            <ol className="step-guide">
                <li data-translate="step1">Find the YouTube video whose thumbnail you want to download.</li>
                <li data-translate="step2">Copy the full URL (web address) of the video from your browser's address bar or the YouTube app's share options.</li>
                <li data-translate="step3">Paste the copied URL into the input box provided above on this page.</li>
                <li>
                <span data-translate="step4">Click the "</span>
                <strong data-translate="getThumbnailsBtn">Get Thumbnails</strong>
                <span data-translate="step4cont">" button.</span>
                </li>
                <li data-translate="step5">The tool will instantly display all available thumbnail resolutions for that video.</li>
                <li data-translate="step6">
                Choose the desired thumbnail size and download method:
                <ul>
                    <li>
                    <span data-translate="step6a">Click the "</span>
                    <strong data-translate="downloadBtn">Download</strong>
                    <span data-translate="step6acont">" button to save the image directly to your device.</span>
                    </li>
                    <li>
                    <span data-translate="step6b">Click the "</span>
                    <strong data-translate="copyUrlBtn">Copy URL</strong>
                    <span data-translate="step6bcont">" button to copy the image link for embedding in websites, documents, or sharing on social media.</span>
                    </li>
                </ul>
                </li>
                <li data-translate="step7">For best results, choose the highest resolution available (usually "Max HD") unless you need a specific size for your project.</li>
            </ol>
            <p className="tip" data-translate="howToTip">
                <strong>Pro Tip:</strong> You can use this tool on mobile devices too! Just share the YouTube video link from the YouTube app to your browser, then paste it here.
            </p>
        </section>


        {/* Why Choose Us Section */}
        <section className="content-section enhanced">
            <h2 data-translate="whyTitle">Why Use Our Downloader?</h2>
            <p data-translate="whyIntro">
                Our YouTube thumbnail downloader stands out from other tools with these key benefits:
            </p>

            <div className="feature-grid">
                <div className="feature-card">
                <h3 data-translate="why1strong">Fast and Easy</h3>
                <p data-translate="why1text">
                    Get thumbnails in seconds with a simple copy-paste action. No complex steps required.
                </p>
                </div>

                <div className="feature-card">
                <h3 data-translate="why2strong">High Quality</h3>
                <p data-translate="why2text">
                    Download thumbnails in the highest available resolutions, including HD (1280x720) when available.
                </p>
                </div>

                <div className="feature-card">
                <h3 data-translate="why3strong">Multiple Resolutions</h3>
                <p data-translate="why3text">
                    We provide options for various sizes (HD, SD, HQ, MQ) so you can pick the perfect fit.
                </p>
                </div>

                <div className="feature-card">
                <h3 data-translate="why4strong">Completely Free</h3>
                <p data-translate="why4text">
                    This is a free tool for everyone. No hidden costs or sign-ups needed to download YouTube thumbnails.
                </p>
                </div>

                <div className="feature-card">
                <h3 data-translate="why5strong">No Software Installation</h3>
                <p data-translate="why5text">
                    Works directly in your web browser on any device (desktop, tablet, mobile).
                </p>
                </div>

                <div className="feature-card">
                <h3 data-translate="why6strong">Clean and Secure</h3>
                <p data-translate="why6text">
                    We prioritize a simple experience and fetch images directly from YouTube's secure servers
                    (img.youtube.com).
                </p>
                </div>
            </div>

            <p style={{ textAlign: "center", marginTop: "2rem" }} data-translate="whyConclusion">
                This YouTube thumbnail grabber is ideal for content creators, social media managers, designers, or anyone
                needing quick access to video thumbnails.
            </p>

            <div className="use-cases">
                <h3 data-translate="whyUseCasesTitle">Popular Use Cases:</h3>
                <ul>
                <li data-translate="useCase1">Creating video thumbnails for your own content</li>
                <li data-translate="useCase2">Researching thumbnail design trends</li>
                <li data-translate="useCase3">Saving thumbnails for educational presentations</li>
                <li data-translate="useCase4">Building content libraries and mood boards</li>
                <li data-translate="useCase5">Analyzing competitor thumbnails for marketing research</li>
                </ul>
            </div>
        </section>


        {/* FAQ Section */}
         <section className="content-section enhanced" id="faqSection">
            <h2 data-translate="faqTitle">Frequently Asked Questions (FAQ)</h2>
            <dl>
                <dt data-translate="faqQ1">How do I download a YouTube thumbnail?</dt>
                <dd data-translate="faqA1">
                Simply paste the full YouTube video URL into the input box on this page and click "Get Thumbnails". We'll
                show you all available sizes (HD, SD, etc.), and you can click the "Download" button for the one you want.
                The image will be saved to your device's default download location.
                </dd>

                <dt data-translate="faqQ2">What thumbnail resolutions can I download?</dt>
                <dd data-translate="faqA2">
                We attempt to fetch several standard YouTube thumbnail resolutions: Maximum High Definition
                (Maxres/1280x720, if available), Standard Definition (SD/640x480), High Quality (HQ/480x360), and Medium
                Quality (MQ/320x180). The highest quality (Maxres HD) isn't always generated by YouTube for every video,
                especially for older or less popular content.
                </dd>

                <dt data-translate="faqQ3">Is it free to use this YouTube thumbnail downloader?</dt>
                <dd data-translate="faqA3">
                Yes, this tool is completely free to use. You can download as many thumbnails as you need without any
                charge or registration. We don't require account creation, email addresses, or any personal information.
                </dd>

                <dt data-translate="faqQ4">Can I download thumbnails for private videos?</dt>
                <dd data-translate="faqA4">
                No, this tool can only fetch thumbnails for publicly accessible YouTube videos. Thumbnails for private or
                unlisted videos that require login cannot be accessed. This is a limitation of YouTube's platform, not our
                tool.
                </dd>

                <dt data-translate="faqQ5">Are there any copyright restrictions on downloaded thumbnails?</dt>
                <dd data-translate="faqA5">
                Yes. YouTube thumbnails are typically copyrighted either by YouTube or the video creator. You should only
                use downloaded thumbnails in ways that respect copyright laws and YouTube's Terms of Service. Using them
                for your own content without permission might constitute infringement. This tool is provided for
                convenience (e.g., previewing, personal backup, fair use contexts), but you are responsible for how you
                use the images.
                </dd>

                <dt data-translate="faqQ6">Why is the HD (1280x720) thumbnail sometimes missing?</dt>
                <dd data-translate="faqA6">
                YouTube doesn't automatically generate the `maxresdefault.jpg` (HD 1280x720) thumbnail for every single
                video. It's more common on popular or more recently uploaded videos. If it's not available, the
                `sddefault.jpg` (640x480) is usually the next best quality.
                </dd>

                <dt data-translate="faqQ7">Can I use this tool on my mobile device?</dt>
                <dd data-translate="faqA7">
                Our tool works on any device with a web browser, including smartphones and tablets. The responsive design
                ensures a smooth experience regardless of screen size.
                </dd>

                <dt data-translate="faqQ8">How can I use the downloaded thumbnails?</dt>
                <dd data-translate="faqA8">
                Downloaded thumbnails can be used for various purposes such as creating video playlists, blog posts,
                presentations, research, or personal collections. Remember to respect copyright when using thumbnails for
                public or commercial purposes.
                </dd>

                <dt data-translate="faqQ9">Does this tool work with YouTube Shorts?</dt>
                <dd data-translate="faqA9">
                Yes, our tool works with YouTube Shorts as well. Simply paste the YouTube Shorts URL, and we'll extract
                the available thumbnails just like with regular YouTube videos.
                </dd>
            </dl>
        </section>
      </main>

      <footer>
        <nav>
          <ul>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); openModal("aboutModal"); }}
                data-translate="footerAbout"
              >
                About Us
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); openModal("privacyModal"); }}
                data-translate="footerPrivacy"
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); openModal("termsModal"); }}
                data-translate="footerTerms"
              >
                Terms of Service
              </a>
            </li>
            <li>
              {/* Link directly to the FAQ section */}
              <a href="#faqSection" data-translate="footerFaq">
                FAQ
              </a>
            </li>
          </ul>
        </nav>
        <p>
          © <span id="currentYear"></span> <span data-translate="siteTitleFooter">YouTube Thumbnail Downloader</span>.{" "}
          <span data-translate="footerRights">All rights reserved.</span>
        </p>
        <p data-translate="footerDisclaimer">
          Disclaimer: Downloaded thumbnails are subject to YouTube's and the creator's copyrights. Use responsibly.
        </p>
      </footer>

      {/* Modals - Structure remains same, content translated via data-translate */}
      {currentModal === "aboutModal" && (
        <div id="aboutModal" className="modal" style={{ display: "flex" }}>
          <div className="modal-content">
            <span className="modal-close" onClick={closeModal}>×</span>
            <h2 data-translate="aboutTitle">About This Tool</h2>
            <p data-translate="aboutP1">Welcome! This is your simple and efficient tool...</p>
            <p data-translate="aboutP2">We created this tool to provide a quick and easy way...</p>
            <p data-translate="aboutP3">Simply paste the YouTube video URL into the input box...</p>
            <p data-translate="aboutP4">Our goal is to keep this tool fast, reliable...</p>
            <p><strong data-translate="aboutP5Strong">Please Note:</strong> <span data-translate="aboutP5Text">Thumbnails are the property...</span></p>
          </div>
        </div>
      )}

      {currentModal === "privacyModal" && (
        <div id="privacyModal" className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
                <span className="modal-close" onClick={closeModal}>×</span>
                <h2 data-translate="privacyTitle">Privacy Policy</h2>
                <p data-translate="privacyP1">Your privacy is important to us...</p>
                <p><strong data-translate="privacyHInfo">Information We Handle:</strong></p>
                <ul>
                <li><strong data-translate="privacyInfo1Strong">YouTube URLs:</strong> <span data-translate="privacyInfo1Text">We process the YouTube URLs...</span></li>
                <li><strong data-translate="privacyInfo2Strong">Usage Data:</strong> <span data-translate="privacyInfo2Text">We do not collect personal identifying information...</span></li>
                <li><strong data-translate="privacyInfo3Strong">Cookies/Local Storage:</strong> <span data-translate="privacyInfo3Text">We use `localStorage` only...</span></li>
                </ul>
                <p><strong data-translate="privacyHUse">How We Use Information:</strong></p>
                <ul>
                <li data-translate="privacyUse1">To provide the core functionality...</li>
                <li data-translate="privacyUse2">To improve the user experience...</li>
                </ul>
                <p><strong data-translate="privacyHShare">Information Sharing:</strong> <span data-translate="privacyShareText">We do not sell or share...</span></p>
                <p><strong data-translate="privacyHSecurity">Security:</strong> <span data-translate="privacySecurityText">Thumbnail images are fetched directly...</span></p>
                <p><strong data-translate="privacyHChanges">Changes to this Policy:</strong> <span data-translate="privacyChangesText">We may update this Privacy Policy...</span></p>
            </div>
        </div>
      )}

      {currentModal === "termsModal" && (
        <div id="termsModal" className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
                <span className="modal-close" onClick={closeModal}>×</span>
                <h2 data-translate="termsTitle">Terms of Service</h2>
                <p data-translate="termsP1">Welcome! By using our website and services...</p>
                <p><strong data-translate="termsH1">1. Use of Service:</strong></p>
                <ul>
                <li data-translate="terms1a">This tool provides a way to access...</li>
                <li data-translate="terms1b">This service is intended for personal...</li>
                <li data-translate="terms1c">You agree not to use this service for any unlawful purpose...</li>
                </ul>
                <p><strong data-translate="termsH2">2. Intellectual Property:</strong></p>
                <ul>
                <li data-translate="terms2a">The thumbnail images retrieved belong to YouTube...</li>
                <li data-translate="terms2b">This tool does not grant you any rights...</li>
                </ul>
                <p><strong data-translate="termsH3">3. Disclaimer of Warranties:</strong></p>
                <ul>
                <li data-translate="terms3a">This tool is provided "as is"...</li>
                <li data-translate="terms3b">We are not affiliated with YouTube...</li>
                </ul>
                <p><strong data-translate="termsH4">4. Limitation of Liability:</strong> <span data-translate="terms4Text">This tool shall not be liable...</span></p>
                <p><strong data-translate="termsH5">5. Changes to Terms:</strong> <span data-translate="terms5Text">We reserve the right to modify...</span></p>
            </div>
        </div>
      )}

       {/* Schema.org structured data for SEO - ENHANCED */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          // Match your main H1 or Title Tag
          name: "Free YouTube Thumbnail Downloader (HD, SD, HQ)",
          // Your actual domain
          url: "https://yourdomain.com", // <<< CHANGE TO YOUR ACTUAL DOMAIN
           // Match your meta description
          description: "Download any YouTube video thumbnail in HD, SD, HQ quality instantly and for free. Simple online tool - paste URL, get thumbnails. Supports Shorts.",
          applicationCategory: "UtilityApplication",
          operatingSystem: "All", // Applicable to web apps
           // Keywords relevant to the tool
          keywords: "youtube thumbnail downloader, download youtube thumbnail, youtube thumbnail grabber, get youtube thumbnail, yt thumbnail downloader, hd youtube thumbnail, free youtube thumbnail downloader, online youtube thumbnail tool, save youtube thumbnail, extract youtube thumbnail, youtube shorts thumbnail",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          // List key features accurately
          featureList: [
            "Download YouTube Thumbnails",
            "HD Quality Thumbnails (1280x720)",
            "SD Quality Thumbnails (640x480)",
            "HQ Quality Thumbnails (480x360)",
            "MQ Quality Thumbnails (320x180)",
            "Supports YouTube Shorts URLs",
            "Direct Download Link",
            "Copy Thumbnail URL Option",
            "Free to Use",
            "No Software Installation Required",
            "No Registration Needed",
            "Works on Desktop and Mobile",
            "Multiple Language Support",
          ],
          // Optional: Identify the provider
          // "provider": {
          //   "@type": "Organization",
          //   "name": "Your Website Name"
          // }

        })}
      </script>
    </>
  )
}


// ========================================
// Translation Data (WITH ADDED LANGUAGES)
// ========================================
const translations = {
  // --- English (Base & Fallback) ---
  en: {
    siteTitle: "YouTube Thumbnail Downloader",
    modeLabel: "Mode",
    mainHeadline: "YouTube Thumbnail Downloader",
    introParagraph:
      "Quickly download any YouTube video's thumbnail in stunning high-definition (HD), standard definition (SD), and other available sizes. Just paste the video link below and click 'Get Thumbnails' – it's that simple!",
    urlPlaceholder: "Paste YouTube video URL (e.g., https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "Get Thumbnails",
    resultsTitle: "Available Thumbnails",
    downloadBtn: "Download",
    copyUrlBtn: "Copy URL",
    howToTitle: "How to Use This Tool",
    step1: "Find the YouTube video whose thumbnail you want to download.",
    step2:
      "Copy the full URL (web address) of the video from your browser's address bar or the YouTube app's share options.",
    step3: "Paste the copied URL into the input box provided above on this page.",
    step4: 'Click the "',
    step4cont: '" button.',
    step5: "The tool will instantly display all available thumbnail resolutions for that video.",
    step6: "Choose the desired thumbnail size and download method:",
    step6a: 'Click the "',
    step6acont: '" button to save the image directly to your device.',
    step6b: 'Click the "',
    step6bcont: '" button to copy the image link for embedding in websites, documents, or sharing on social media.',
    step7:
      'For best results, choose the highest resolution available (usually "Max HD") unless you need a specific size for your project.',
    howToTip:
      "<strong>Pro Tip:</strong> You can use this tool on mobile devices too! Just share the YouTube video link from the YouTube app to your browser, then paste it here.",
    whyTitle: "Why Use Our Downloader?",
    whyIntro: "Our YouTube thumbnail downloader stands out from other tools with these key benefits:",
    why1strong: "Fast and Easy",
    why1text: "Get thumbnails in seconds with a simple copy-paste action. No complex steps required.",
    why2strong: "High Quality",
    why2text: "Download thumbnails in the highest available resolutions, including HD (1280x720) when available.",
    why3strong: "Multiple Resolutions",
    why3text: "We provide options for various sizes (HD, SD, HQ, MQ) so you can pick the perfect fit.",
    why4strong: "Completely Free",
    why4text: "This is a free tool for everyone. No hidden costs or sign-ups needed to download YouTube thumbnails.",
    why5strong: "No Software Installation",
    why5text: "Works directly in your web browser on any device (desktop, tablet, mobile).",
    why6strong: "Clean and Secure",
    why6text:
      "We prioritize a simple experience and fetch images directly from YouTube's secure servers (img.youtube.com).",
    whyConclusion:
      "This YouTube thumbnail grabber is ideal for content creators, social media managers, designers, or anyone needing quick access to video thumbnails.",
    whyUseCasesTitle: "Popular Use Cases:",
    useCase1: "Creating video thumbnails for your own content",
    useCase2: "Researching thumbnail design trends",
    useCase3: "Saving thumbnails for educational presentations",
    useCase4: "Building content libraries and mood boards",
    useCase5: "Analyzing competitor thumbnails for marketing research",
    faqTitle: "Frequently Asked Questions (FAQ)",
    faqQ1: "How do I download a YouTube thumbnail?",
    faqA1:
      'Simply paste the full YouTube video URL into the input box on this page and click "Get Thumbnails". We\'ll show you all available sizes (HD, SD, etc.), and you can click the "Download" button for the one you want. The image will be saved to your device\'s default download location.',
    faqQ2: "What thumbnail resolutions can I download?",
    faqA2:
      "We attempt to fetch several standard YouTube thumbnail resolutions: Maximum High Definition (Maxres/1280x720, if available), Standard Definition (SD/640x480), High Quality (HQ/480x360), and Medium Quality (MQ/320x180). The highest quality (Maxres HD) isn't always generated by YouTube for every video, especially for older or less popular content.",
    faqQ3: "Is it free to use this YouTube thumbnail downloader?",
    faqA3:
      "Yes, this tool is completely free to use. You can download as many thumbnails as you need without any charge or registration. We don't require account creation, email addresses, or any personal information.",
    faqQ4: "Can I download thumbnails for private videos?",
    faqA4:
      "No, this tool can only fetch thumbnails for publicly accessible YouTube videos. Thumbnails for private or unlisted videos that require login cannot be accessed. This is a limitation of YouTube's platform, not our tool.",
    faqQ5: "Are there any copyright restrictions on downloaded thumbnails?",
    faqA5:
      "Yes. YouTube thumbnails are typically copyrighted either by YouTube or the video creator. You should only use downloaded thumbnails in ways that respect copyright laws and YouTube's Terms of Service. Using them for your own content without permission might constitute infringement. This tool is provided for convenience (e.g., previewing, personal backup, fair use contexts), but you are responsible for how you use the images.",
    faqQ6: "Why is the HD (1280x720) thumbnail sometimes missing?",
    faqA6:
      "YouTube doesn't automatically generate the `maxresdefault.jpg` (HD 1280x720) thumbnail for every single video. It's more common on popular or more recently uploaded videos. If it's not available, the `sddefault.jpg` (640x480) is usually the next best quality.",
    faqQ7: "Can I use this tool on my mobile device?",
    faqA7:
      "Our tool works on any device with a web browser, including smartphones and tablets. The responsive design ensures a smooth experience regardless of screen size.",
    faqQ8: "How can I use the downloaded thumbnails?",
    faqA8:
      "Downloaded thumbnails can be used for various purposes such as creating video playlists, blog posts, presentations, research, or personal collections. Remember to respect copyright when using thumbnails for public or commercial purposes.",
    faqQ9: "Does this tool work with YouTube Shorts?",
    faqA9:
      "Yes, our tool works with YouTube Shorts as well. Simply paste the YouTube Shorts URL, and we'll extract the available thumbnails just like with regular YouTube videos.",
    footerAbout: "About Us",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Service",
    footerFaq: "FAQ",
    siteTitleFooter: "YouTube Thumbnail Downloader",
    footerRights: "All rights reserved.",
    footerDisclaimer:
      "Disclaimer: Downloaded thumbnails are subject to YouTube's and the creator's copyrights. Use responsibly.",
    aboutTitle: "About This Tool",
    aboutP1: "Welcome! This is your simple and efficient tool for downloading YouTube video thumbnails.",
    aboutP2:
      "We created this tool to provide a quick and easy way for content creators, marketers, and anyone interested to grab high-quality thumbnails from YouTube videos. Whether you need inspiration, placeholders, or are archiving content, this tool gets you the images you need without hassle.",
    aboutP3:
      'Simply paste the YouTube video URL into the input box, click "Get Thumbnails", and choose the resolution that best suits your needs. You can easily download the image or copy its URL.',
    aboutP4: "Our goal is to keep this tool fast, reliable, and user-friendly. We hope you find it useful!",
    aboutP5Strong: "Please Note:",
    aboutP5Text:
      "Thumbnails are the property of their respective owners. Please use this tool responsibly and respect copyright regulations and YouTube's Terms of Service.",
    privacyTitle: "Privacy Policy",
    privacyP1: "Your privacy is important to us. This Privacy Policy explains how this tool handles information.",
    privacyHInfo: "Information We Handle:",
    privacyInfo1Strong: "YouTube URLs:",
    privacyInfo1Text:
      "We process the YouTube URLs you enter solely to fetch the corresponding video thumbnails from YouTube's publicly available image servers (img.youtube.com). We do not store these URLs after processing your request.",
    privacyInfo2Strong: "Usage Data:",
    privacyInfo2Text:
      "We do not collect personal identifying information. We may use basic, anonymous analytics (like page views or feature usage, if implemented) to understand usage and improve the service, but this is not linked to individuals.",
    privacyInfo3Strong: "Cookies/Local Storage:",
    privacyInfo3Text:
      "We use `localStorage` only to remember your preference for language and light/dark mode. No other tracking cookies are used.",
    privacyHUse: "How We Use Information:",
    privacyUse1: "To provide the core functionality of the thumbnail downloader.",
    privacyUse2: "To improve the user experience (e.g., remembering dark mode, language).",
    privacyHShare: "Information Sharing:",
    privacyShareText: "We do not sell or share any user-provided information or identifiable data with third parties.",
    privacyHSecurity: "Security:",
    privacySecurityText: "Thumbnail images are fetched directly from YouTube's secure (HTTPS) servers.",
    privacyHChanges: "Changes to this Policy:",
    privacyChangesText: "We may update this Privacy Policy occasionally. We encourage you to review it periodically.",
    termsTitle: "Terms of Service",
    termsP1:
      "Welcome! By using our website and services, you agree to comply with and be bound by the following terms and conditions.",
    termsH1: "1. Use of Service:",
    terms1a:
      "This tool provides a way to access and view publicly available thumbnail images associated with YouTube videos.",
    terms1b:
      "This service is intended for personal, non-commercial use, such as previewing, referencing, or creating backups for content you own or have rights to use (fair use).",
    terms1c:
      "You agree not to use this service for any unlawful purpose, including copyright infringement, or in any way that violates YouTube's Terms of Service.",
    termsH2: "2. Intellectual Property:",
    terms2a: "The thumbnail images retrieved belong to YouTube or the respective content creators.",
    terms2b:
      "This tool does not grant you any rights to these images. You are solely responsible for ensuring you have the necessary permissions for any use beyond fair use or personal viewing.",
    termsH3: "3. Disclaimer of Warranties:",
    terms3a:
      'This tool is provided "as is" without any warranties. We do not guarantee the availability, accuracy, or reliability of the service or that all thumbnail resolutions will exist for every video.',
    terms3b: "We are not affiliated with YouTube or Google LLC.",
    termsH4: "4. Limitation of Liability:",
    terms4Text:
      "This tool shall not be liable for any damages resulting from the use or inability to use this service.",
    termsH5: "5. Changes to Terms:",
    terms5Text: "We reserve the right to modify these terms at any time.",
    feedbackCopied: "Image URL copied!",
    feedbackCopyFail: "Failed to copy URL.",
    feedbackInvalidUrl: "Invalid YouTube URL format. Please paste the full video URL.",
    feedbackNoUrl: "Please paste a YouTube URL first.",
    feedbackLoadError: "Could not load any thumbnails. Video might be private or deleted.",
    feedbackUnexpectedError: "An unexpected error occurred.",
    resMaxHd: "Max HD (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // --- Arabic ---
  ar: {
    siteTitle: "تحميل صور يوتيوب المصغرة",
    modeLabel: "الوضع",
    mainHeadline: "تحميل صور يوتيوب المصغرة",
    introParagraph:
      "قم بتنزيل صورة مصغرة لأي فيديو يوتيوب بسرعة بجودة عالية الدقة (HD) ودقة قياسية (SD) وأحجام أخرى متاحة. فقط الصق رابط الفيديو أدناه وانقر على 'جلب الصور المصغرة' - الأمر بهذه البساطة!",
    urlPlaceholder: "الصق رابط فيديو يوتيوب (مثال: https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "جلب الصور المصغرة",
    resultsTitle: "الصور المصغرة المتاحة",
    downloadBtn: "تحميل",
    copyUrlBtn: "نسخ الرابط",
    howToTitle: "كيفية استخدام هذه الأداة",
    step1: "ابحث عن فيديو يوتيوب الذي تريد تحميل صورته المصغرة.",
    step2: "انسخ عنوان URL الكامل (عنوان الويب) للفيديو من شريط عنوان المتصفح أو خيارات المشاركة في تطبيق يوتيوب.",
    step3: "الصق عنوان URL المنسوخ في مربع الإدخال أعلاه في هذه الصفحة.",
    step4: 'انقر على زر "',
    step4cont: '".',
    step5: "ستعرض الأداة فورًا جميع دقات الصور المصغرة المتاحة لهذا الفيديو.",
    step6: "اختر حجم الصورة المصغرة المطلوب وطريقة التحميل:",
    step6a: 'انقر على زر "',
    step6acont: '" لحفظ الصورة مباشرة على جهازك.',
    step6b: 'انقر على زر "',
    step6bcont:
      '" لنسخ رابط الصورة لتضمينها في المواقع الإلكترونية أو المستندات أو مشاركتها على وسائل التواصل الاجتماعي.',
    step7: 'للحصول على أفضل النتائج، اختر أعلى دقة متاحة (عادة "HD أقصى") ما لم تكن بحاجة إلى حجم معين لمشروعك.',
    howToTip:
      "<strong>نصيحة احترافية:</strong> يمكنك استخدام هذه الأداة على الأجهزة المحمولة أيضًا! فقط شارك رابط فيديو يوتيوب من تطبيق يوتيوب إلى متصفحك، ثم الصقه هنا.",
    whyTitle: "لماذا استخدام أداة التحميل الخاصة بنا؟",
    whyIntro: "تتميز أداة تنزيل صور يوتيوب المصغرة لدينا عن الأدوات الأخرى بهذه المزايا الرئيسية:",
    why1strong: "سريع وسهل",
    why1text: "احصل على الصور المصغرة في ثوانٍ بعملية نسخ ولصق بسيطة. لا خطوات معقدة مطلوبة.",
    why2strong: "جودة عالية",
    why2text: "قم بتنزيل الصور المصغرة بأعلى الدقات المتاحة، بما في ذلك HD (1280x720) عند توفرها.",
    why3strong: "دقات متعددة",
    why3text: "نوفر خيارات لأحجام مختلفة (HD، SD، HQ، MQ) حتى تتمكن من اختيار الأنسب.",
    why4strong: "مجاني تمامًا",
    why4text: "هذه أداة مجانية للجميع. لا توجد تكاليف خفية أو حاجة للتسجيل لتحميل صور يوتيوب المصغرة.",
    why5strong: "لا حاجة لتثبيت برامج",
    why5text: "يعمل مباشرة في متصفح الويب الخاص بك على أي جهاز (سطح المكتب، جهاز لوحي، هاتف محمول).",
    why6strong: "نظيف وآمن",
    why6text: "نعطي الأولوية لتجربة بسيطة ونقوم بجلب الصور مباشرة من خوادم يوتيوب الآمنة (img.youtube.com).",
    whyConclusion:
      "أداة تحميل صور يوتيوب المصغرة هذه مثالية لمنشئي المحتوى ومديري وسائل التواصل الاجتماعي والمصممين وأي شخص يحتاج إلى وصول سريع إلى الصور المصغرة للفيديو.",
    whyUseCasesTitle: "حالات الاستخدام الشائعة:",
    useCase1: "إنشاء صور مصغرة للفيديو للمحتوى الخاص بك",
    useCase2: "البحث في اتجاهات تصميم الصور المصغرة",
    useCase3: "حفظ الصور المصغرة للعروض التقديمية التعليمية",
    useCase4: "بناء مكتبات المحتوى ولوحات الأفكار",
    useCase5: "تحليل الصور المصغرة للمنافسين لأبحاث التسويق",
    faqTitle: "الأسئلة الشائعة (FAQ)",
    faqQ1: "كيف أقوم بتنزيل صورة يوتيوب مصغرة؟",
    faqA1:
      'ببساطة، الصق رابط فيديو يوتيوب الكامل في مربع الإدخال في هذه الصفحة وانقر على "جلب الصور المصغرة". سنعرض لك جميع الأحجام المتاحة (HD ، SD ، إلخ) ، ويمكنك النقر فوق زر "تحميل" للصورة التي تريدها. سيتم حفظ الصورة في موقع التنزيل الافتراضي لجهازك.',
    faqQ2: "ما هي دقات الصور المصغرة التي يمكنني تنزيلها؟",
    faqA2:
      "نحاول جلب العديد من دقات الصور المصغرة القياسية ليوتيوب: أقصى دقة عالية (Maxres/1280x720 ، إن وجدت) ، الدقة القياسية (SD/640x480) ، الجودة العالية (HQ/480x360) ، والجودة المتوسطة (MQ/320x180). لا يتم دائمًا إنشاء أعلى جودة (Maxres HD) بواسطة يوتيوب لكل فيديو، خاصة للمحتوى القديم أو الأقل شعبية.",
    faqQ3: "هل استخدام أداة تحميل صور يوتيوب المصغرة هذه مجاني؟",
    faqA3:
      "نعم ، هذه الأداة مجانية تمامًا للاستخدام. يمكنك تنزيل أي عدد تريده من الصور المصغرة دون أي رسوم أو تسجيل. نحن لا نطلب إنشاء حساب أو عناوين بريد إلكتروني أو أي معلومات شخصية.",
    faqQ4: "هل يمكنني تنزيل الصور المصغرة لمقاطع الفيديو الخاصة؟",
    faqA4:
      "لا ، يمكن لهذه الأداة فقط جلب الصور المصغرة لمقاطع فيديو يوتيوب المتاحة للجمهور. لا يمكن الوصول إلى الصور المصغرة لمقاطع الفيديو الخاصة أو غير المدرجة التي تتطلب تسجيل الدخول. هذا قيد من منصة يوتيوب، وليس من أداتنا.",
    faqQ5: "هل هناك قيود على حقوق النشر للصور المصغرة التي تم تنزيلها؟",
    faqA5:
      "نعم. عادة ما تكون الصور المصغرة ليوتيوب محمية بحقوق الطبع والنشر إما بواسطة يوتيوب أو منشئ الفيديو. يجب عليك فقط استخدام الصور المصغرة التي تم تنزيلها بطرق تحترم قوانين حقوق النشر وشروط خدمة يوتيوب. قد يشكل استخدامها للمحتوى الخاص بك دون إذن انتهاكًا. يتم توفير هذه الأداة للراحة (على سبيل المثال ، المعاينة ، النسخ الاحتياطي الشخصي ، سياقات الاستخدام العادل) ، لكنك مسؤول عن كيفية استخدامك للصور.",
    faqQ6: "لماذا تكون الصورة المصغرة عالية الدقة (1280x720) مفقودة أحيانًا؟",
    faqA6:
      "لا يقوم يوتيوب تلقائيًا بإنشاء الصورة المصغرة `maxresdefault.jpg` (HD 1280x720) لكل فيديو. إنها أكثر شيوعًا في مقاطع الفيديو الشائعة أو التي تم تحميلها مؤخرًا. إذا لم تكن متوفرة ، فعادة ما تكون `sddefault.jpg` (640x480) هي ثاني أفضل جودة.",
    faqQ7: "هل يمكنني استخدام هذه الأداة على جهازي المحمول؟",
    faqA7:
      "تعمل أداتنا على أي جهاز به متصفح ويب، بما في ذلك الهواتف الذكية والأجهزة اللوحية. يضمن التصميم المتجاوب تجربة سلسة بغض النظر عن حجم الشاشة.",
    faqQ8: "كيف يمكنني استخدام الصور المصغرة التي تم تنزيلها؟",
    faqA8:
      "يمكن استخدام الصور المصغرة التي تم تنزيلها لأغراض مختلفة مثل إنشاء قوائم تشغيل الفيديو، ومنشورات المدونات، والعروض التقديمية، والأبحاث، أو المجموعات الشخصية. تذكر احترام حقوق النشر عند استخدام الصور المصغرة للأغراض العامة أو التجارية.",
    faqQ9: "هل تعمل هذه الأداة مع مقاطع يوتيوب القصيرة (Shorts)؟",
    faqA9:
      "نعم، تعمل أداتنا مع مقاطع يوتيوب القصيرة أيضًا. ما عليك سوى لصق عنوان URL لمقطع يوتيوب القصير، وسنستخرج الصور المصغرة المتاحة تمامًا كما هو الحال مع مقاطع فيديو يوتيوب العادية.",
    footerAbout: "معلومات عنا",
    footerPrivacy: "سياسة الخصوصية",
    footerTerms: "شروط الخدمة",
    footerFaq: "الأسئلة الشائعة",
    siteTitleFooter: "تحميل صور يوتيوب المصغرة",
    footerRights: "جميع الحقوق محفوظة.",
    footerDisclaimer:
      "إخلاء مسؤولية: الصور المصغرة التي تم تنزيلها تخضع لحقوق الطبع والنشر الخاصة بيوتيوب ومنشئ المحتوى. استخدمها بمسؤولية.",
    aboutTitle: "حول هذه الأداة",
    aboutP1: "مرحبًا! هذه هي أداتك البسيطة والفعالة لتنزيل صور فيديو يوتيوب المصغرة.",
    aboutP2:
      "لقد أنشأنا هذه الأداة لتوفير طريقة سريعة وسهلة لمنشئي المحتوى والمسوقين وأي شخص مهتم بالحصول على صور مصغرة عالية الجودة من مقاطع فيديو يوتيوب. سواء كنت بحاجة إلى الإلهام أو العناصر النائبة أو تقوم بأرشفة المحتوى، فإن هذه الأداة توفر لك الصور التي تحتاجها دون متاعب.",
    aboutP3:
      'ما عليك سوى لصق عنوان URL لفيديو يوتيوب في مربع الإدخال، والنقر على "جلب الصور المصغرة"، واختيار الدقة التي تناسب احتياجاتك. يمكنك بسهولة تنزيل الصورة أو نسخ عنوان URL الخاص بها.',
    aboutP4: "هدفنا هو الحفاظ على هذه الأداة سريعة وموثوقة وسهلة الاستخدام. نأمل أن تجدها مفيدة!",
    aboutP5Strong: "يرجى الملاحظة:",
    aboutP5Text:
      "الصور المصغرة هي ملك لأصحابها. يرجى استخدام هذه الأداة بمسؤولية واحترام لوائح حقوق النشر وشروط خدمة يوتيوب.",
    privacyTitle: "سياسة الخصوصية",
    privacyP1: "خصوصيتك تهمنا. توضح سياسة الخصوصية هذه كيف تتعامل هذه الأداة مع المعلومات.",
    privacyHInfo: "المعلومات التي نتعامل معها:",
    privacyInfo1Strong: "عناوين URL ليوتيوب:",
    privacyInfo1Text:
      "نقوم بمعالجة عناوين URL ليوتيوب التي تدخلها فقط لجلب الصور المصغرة للفيديو المقابلة من خوادم الصور المتاحة للجمهور في يوتيوب (img.youtube.com). لا نقوم بتخزين عناوين URL هذه بعد معالجة طلبك.",
    privacyInfo2Strong: "بيانات الاستخدام:",
    privacyInfo2Text:
      "نحن لا نجمع معلومات تعريف شخصية. قد نستخدم تحليلات أساسية ومجهولة (مثل مشاهدات الصفحة أو استخدام الميزات ، إذا تم تنفيذها) لفهم الاستخدام وتحسين الخدمة ، ولكن هذا غير مرتبط بالأفراد.",
    privacyInfo3Strong: "ملفات تعريف الارتباط / التخزين المحلي:",
    privacyInfo3Text:
      "نستخدم `localStorage` فقط لتذكر تفضيلك للغة ووضع الإضاءة / الظلام. لا يتم استخدام ملفات تعريف ارتباط تتبع أخرى.",
    privacyHUse: "كيف نستخدم المعلومات:",
    privacyUse1: "لتوفير الوظائف الأساسية لأداة تنزيل الصور المصغرة.",
    privacyUse2: "لتحسين تجربة المستخدم (مثل تذكر الوضع المظلم واللغة).",
    privacyHShare: "مشاركة المعلومات:",
    privacyShareText: "نحن لا نبيع أو نشارك أي معلومات مقدمة من المستخدم أو بيانات تعريف مع أطراف ثالثة.",
    privacyHSecurity: "الأمان:",
    privacySecurityText: "يتم جلب صور الصور المصغرة مباشرة من خوادم يوتيوب الآمنة (HTTPS).",
    privacyHChanges: "التغييرات على هذه السياسة:",
    privacyChangesText: "قد نقوم بتحديث سياسة الخصوصية هذه من حين لآخر. نشجعك على مراجعتها بشكل دوري.",
    termsTitle: "شروط الخدمة",
    termsP1: "مرحبًا! باستخدام موقعنا وخدماتنا ، فإنك توافق على الامتثال للشروط والأحكام التالية والالتزام بها.",
    termsH1: "1. استخدام الخدمة:",
    terms1a: "توفر هذه الأداة طريقة للوصول إلى صور الصور المصغرة المتاحة للجمهور المرتبطة بمقاطع فيديو يوتيوب وعرضها.",
    terms1b:
      "هذه الخدمة مخصصة للاستخدام الشخصي وغير التجاري ، مثل المعاينة أو الرجوع أو إنشاء نسخ احتياطية للمحتوى الذي تملكه أو لديك حقوق استخدامه (الاستخدام العادل).",
    terms1c:
      "أنت توافق على عدم استخدام هذه الخدمة لأي غرض غير قانوني ، بما في ذلك انتهاك حقوق النشر ، أو بأي طريقة تنتهك شروط خدمة يوتيوب.",
    termsH2: "2. الملكية الفكرية:",
    terms2a: "تنتمي صور الصور المصغرة التي تم استردادها إلى يوتيوب أو منشئي المحتوى المعنيين.",
    terms2b:
      "لا تمنحك هذه الأداة أي حقوق في هذه الصور. أنت وحدك المسؤول عن التأكد من حصولك على الأذونات اللازمة لأي استخدام يتجاوز الاستخدام العادل أو المشاهدة الشخصية.",
    termsH3: "3. إخلاء المسؤولية عن الضمانات:",
    terms3a:
      'يتم توفير هذه الأداة "كما هي" دون أي ضمانات. نحن لا نضمن توفر الخدمة أو دقتها أو موثوقيتها أو وجود جميع دقات الصور المصغرة لكل فيديو.',
    terms3b: "نحن لسنا تابعين ليوتيوب أو جوجل LLC.",
    termsH4: "4. تحديد المسؤولية:",
    terms4Text: "لن تكون هذه الأداة مسؤولة عن أي أضرار ناتجة عن استخدام أو عدم القدرة على استخدام هذه الخدمة.",
    termsH5: "5. التغييرات على الشروط:",
    terms5Text: "نحتفظ بالحق في تعديل هذه الشروط في أي وقت.",
    feedbackCopied: "تم نسخ رابط الصورة!",
    feedbackCopyFail: "فشل نسخ الرابط.",
    feedbackInvalidUrl: "تنسيق رابط يوتيوب غير صالح. يرجى لصق رابط الفيديو الكامل.",
    feedbackNoUrl: "يرجى لصق رابط يوتيوب أولاً.",
    feedbackLoadError: "تعذر تحميل أي صور مصغرة. قد يكون الفيديو خاصًا أو محذوفًا.",
    feedbackUnexpectedError: "حدث خطأ غير متوقع.",
    resMaxHd: "HD أقصى (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // --- Spanish ---
  es: {
    siteTitle: "Descargador de Miniaturas de YouTube",
    modeLabel: "Modo",
    mainHeadline: "Descargador de Miniaturas de YouTube",
    introParagraph:
      "Descarga rápidamente la miniatura de cualquier video de YouTube en alta definición (HD), definición estándar (SD) y otros tamaños disponibles. Simplemente pega el enlace del video a continuación y haz clic en 'Obtener Miniaturas'. ¡Es así de simple!",
    urlPlaceholder: "Pega la URL del video de YouTube (ej., https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "Obtener Miniaturas",
    resultsTitle: "Miniaturas Disponibles",
    downloadBtn: "Descargar",
    copyUrlBtn: "Copiar URL",
    howToTitle: "Cómo Usar Esta Herramienta",
    step1: "Encuentra el video de YouTube cuya miniatura deseas descargar.",
    step2:
      "Copia la URL completa (dirección web) del video desde la barra de direcciones de tu navegador o las opciones de compartir de la aplicación de YouTube.",
    step3: "Pega la URL copiada en el cuadro de entrada proporcionado arriba en esta página.",
    step4: 'Haz clic en el botón "',
    step4cont: '".',
    step5: "La herramienta mostrará instantáneamente todas las resoluciones de miniaturas disponibles para ese video.",
    step6: "Elige el tamaño de miniatura deseado y el método de descarga:",
    step6a: 'Haz clic en el botón "',
    step6acont: '" para guardar la imagen directamente en tu dispositivo.',
    step6b: 'Haz clic en el botón "',
    step6bcont: '" para copiar el enlace de la imagen para incrustarlo en sitios web, documentos o compartirlo en redes sociales.',
    step7:
      'Para obtener los mejores resultados, elige la resolución más alta disponible (generalmente "Max HD") a menos que necesites un tamaño específico para tu proyecto.',
    howToTip:
      "<strong>Consejo Profesional:</strong> ¡También puedes usar esta herramienta en dispositivos móviles! Simplemente comparte el enlace del video de YouTube desde la aplicación de YouTube a tu navegador, luego pégalo aquí.",
    whyTitle: "¿Por Qué Usar Nuestro Descargador?",
    whyIntro: "Nuestro descargador de miniaturas de YouTube se destaca de otras herramientas con estos beneficios clave:",
    why1strong: "Rápido y Fácil",
    why1text: "Obtén miniaturas en segundos con una simple acción de copiar y pegar. No se requieren pasos complejos.",
    why2strong: "Alta Calidad",
    why2text: "Descarga miniaturas en las resoluciones más altas disponibles, incluyendo HD (1280x720) cuando esté disponible.",
    why3strong: "Múltiples Resoluciones",
    why3text: "Ofrecemos opciones para varios tamaños (HD, SD, HQ, MQ) para que puedas elegir el ajuste perfecto.",
    why4strong: "Completamente Gratis",
    why4text: "Esta es una herramienta gratuita para todos. Sin costos ocultos ni necesidad de registrarse para descargar miniaturas de YouTube.",
    why5strong: "Sin Instalación de Software",
    why5text: "Funciona directamente en tu navegador web en cualquier dispositivo (escritorio, tableta, móvil).",
    why6strong: "Limpio y Seguro",
    why6text:
      "Priorizamos una experiencia simple y obtenemos imágenes directamente de los servidores seguros de YouTube (img.youtube.com).",
    whyConclusion:
      "Este capturador de miniaturas de YouTube es ideal para creadores de contenido, administradores de redes sociales, diseñadores o cualquier persona que necesite acceso rápido a las miniaturas de videos.",
    whyUseCasesTitle: "Casos de Uso Populares:",
    useCase1: "Crear miniaturas de video para tu propio contenido",
    useCase2: "Investigar tendencias de diseño de miniaturas",
    useCase3: "Guardar miniaturas para presentaciones educativas",
    useCase4: "Construir bibliotecas de contenido y paneles de inspiración",
    useCase5: "Analizar miniaturas de la competencia para investigación de mercado",
    faqTitle: "Preguntas Frecuentes (FAQ)",
    faqQ1: "¿Cómo descargo una miniatura de YouTube?",
    faqA1:
      'Simplemente pega la URL completa del video de YouTube en el cuadro de entrada de esta página y haz clic en "Obtener Miniaturas". Te mostraremos todos los tamaños disponibles (HD, SD, etc.), y puedes hacer clic en el botón "Descargar" para el que desees. La imagen se guardará en la ubicación de descarga predeterminada de tu dispositivo.',
    faqQ2: "¿Qué resoluciones de miniaturas puedo descargar?",
    faqA2:
      "Intentamos obtener varias resoluciones estándar de miniaturas de YouTube: Máxima Alta Definición (Maxres/1280x720, si está disponible), Definición Estándar (SD/640x480), Alta Calidad (HQ/480x360) y Calidad Media (MQ/320x180). YouTube no siempre genera la calidad más alta (Maxres HD) para todos los videos, especialmente para contenido más antiguo o menos popular.",
    faqQ3: "¿Es gratuito usar este descargador de miniaturas de YouTube?",
    faqA3:
      "Sí, esta herramienta es completamente gratuita. Puedes descargar tantas miniaturas como necesites sin ningún cargo ni registro. No requerimos creación de cuentas, direcciones de correo electrónico ni ninguna información personal.",
    faqQ4: "¿Puedo descargar miniaturas de videos privados?",
    faqA4:
      "No, esta herramienta solo puede obtener miniaturas de videos de YouTube de acceso público. No se puede acceder a las miniaturas de videos privados o no listados que requieren inicio de sesión. Esta es una limitación de la plataforma de YouTube, no de nuestra herramienta.",
    faqQ5: "¿Existen restricciones de derechos de autor sobre las miniaturas descargadas?",
    faqA5:
      "Sí. Las miniaturas de YouTube suelen estar protegidas por derechos de autor, ya sea por YouTube o por el creador del video. Solo debes usar las miniaturas descargadas de manera que respeten las leyes de derechos de autor y los Términos de Servicio de YouTube. Usarlas para tu propio contenido sin permiso podría constituir una infracción. Esta herramienta se proporciona por conveniencia (p. ej., vista previa, copia de seguridad personal, contextos de uso justo), pero eres responsable de cómo utilizas las imágenes.",
    faqQ6: "¿Por qué a veces falta la miniatura HD (1280x720)?",
    faqA6:
      "YouTube no genera automáticamente la miniatura `maxresdefault.jpg` (HD 1280x720) para cada video. Es más común en videos populares o subidos más recientemente. Si no está disponible, `sddefault.jpg` (640x480) suele ser la siguiente mejor calidad.",
    faqQ7: "¿Puedo usar esta herramienta en mi dispositivo móvil?",
    faqA7:
      "Nuestra herramienta funciona en cualquier dispositivo con un navegador web, incluidos teléfonos inteligentes y tabletas. El diseño adaptable garantiza una experiencia fluida independientemente del tamaño de la pantalla.",
    faqQ8: "¿Cómo puedo usar las miniaturas descargadas?",
    faqA8:
      "Las miniaturas descargadas se pueden utilizar para diversos fines, como crear listas de reproducción de videos, publicaciones de blog, presentaciones, investigaciones o colecciones personales. Recuerda respetar los derechos de autor al usar miniaturas para fines públicos o comerciales.",
    faqQ9: "¿Funciona esta herramienta con YouTube Shorts?",
    faqA9:
      "Sí, nuestra herramienta también funciona con YouTube Shorts. Simplemente pega la URL del Short de YouTube y extraeremos las miniaturas disponibles como con los videos regulares de YouTube.",
    footerAbout: "Acerca de Nosotros",
    footerPrivacy: "Política de Privacidad",
    footerTerms: "Términos de Servicio",
    footerFaq: "FAQ",
    siteTitleFooter: "Descargador de Miniaturas de YouTube",
    footerRights: "Todos los derechos reservados.",
    footerDisclaimer:
      "Descargo de responsabilidad: Las miniaturas descargadas están sujetas a los derechos de autor de YouTube y del creador. Úsalas responsablemente.",
    aboutTitle: "Acerca de Esta Herramienta",
    aboutP1: "¡Bienvenido! Esta es tu herramienta simple y eficiente para descargar miniaturas de videos de YouTube.",
    aboutP2:
      "Creamos esta herramienta para proporcionar una forma rápida y fácil para que los creadores de contenido, especialistas en marketing y cualquier persona interesada obtengan miniaturas de alta calidad de videos de YouTube. Ya sea que necesites inspiración, marcadores de posición o estés archivando contenido, esta herramienta te proporciona las imágenes que necesitas sin complicaciones.",
    aboutP3:
      'Simplemente pega la URL del video de YouTube en el cuadro de entrada, haz clic en "Obtener Miniaturas" y elige la resolución que mejor se adapte a tus necesidades. Puedes descargar fácilmente la imagen o copiar su URL.',
    aboutP4: "Nuestro objetivo es mantener esta herramienta rápida, confiable y fácil de usar. ¡Esperamos que la encuentres útil!",
    aboutP5Strong: "Por favor, ten en cuenta:",
    aboutP5Text:
      "Las miniaturas son propiedad de sus respectivos dueños. Utiliza esta herramienta de manera responsable y respeta las regulaciones de derechos de autor y los Términos de Servicio de YouTube.",
    privacyTitle: "Política de Privacidad",
    privacyP1: "Tu privacidad es importante para nosotros. Esta Política de Privacidad explica cómo esta herramienta maneja la información.",
    privacyHInfo: "Información que Manejamos:",
    privacyInfo1Strong: "URLs de YouTube:",
    privacyInfo1Text:
      "Procesamos las URLs de YouTube que ingresas únicamente para obtener las miniaturas de video correspondientes de los servidores de imágenes públicamente disponibles de YouTube (img.youtube.com). No almacenamos estas URLs después de procesar tu solicitud.",
    privacyInfo2Strong: "Datos de Uso:",
    privacyInfo2Text:
      "No recopilamos información de identificación personal. Podemos usar análisis básicos y anónimos (como vistas de página o uso de funciones, si se implementan) para comprender el uso y mejorar el servicio, pero esto no está vinculado a individuos.",
    privacyInfo3Strong: "Cookies/Almacenamiento Local:",
    privacyInfo3Text:
      "Usamos `localStorage` solo para recordar tu preferencia de idioma y modo claro/oscuro. No se utilizan otras cookies de seguimiento.",
    privacyHUse: "Cómo Usamos la Información:",
    privacyUse1: "Para proporcionar la funcionalidad principal del descargador de miniaturas.",
    privacyUse2: "Para mejorar la experiencia del usuario (p. ej., recordar el modo oscuro, el idioma).",
    privacyHShare: "Compartir Información:",
    privacyShareText: "No vendemos ni compartimos ninguna información proporcionada por el usuario o datos identificables con terceros.",
    privacyHSecurity: "Seguridad:",
    privacySecurityText: "Las imágenes de las miniaturas se obtienen directamente de los servidores seguros (HTTPS) de YouTube.",
    privacyHChanges: "Cambios a esta Política:",
    privacyChangesText: "Podemos actualizar esta Política de Privacidad ocasionalmente. Te recomendamos revisarla periódicamente.",
    termsTitle: "Términos de Servicio",
    termsP1:
      "¡Bienvenido! Al usar nuestro sitio web y servicios, aceptas cumplir y estar sujeto a los siguientes términos y condiciones.",
    termsH1: "1. Uso del Servicio:",
    terms1a:
      "Esta herramienta proporciona una forma de acceder y ver imágenes de miniaturas públicamente disponibles asociadas con videos de YouTube.",
    terms1b:
      "Este servicio está destinado para uso personal y no comercial, como previsualización, referencia o creación de copias de seguridad para contenido que posees o tienes derechos para usar (uso justo).",
    terms1c:
      "Aceptas no usar este servicio para ningún propósito ilegal, incluida la infracción de derechos de autor, o de ninguna manera que viole los Términos de Servicio de YouTube.",
    termsH2: "2. Propiedad Intelectual:",
    terms2a: "Las imágenes de miniaturas recuperadas pertenecen a YouTube o a los respectivos creadores de contenido.",
    terms2b:
      "Esta herramienta no te otorga ningún derecho sobre estas imágenes. Eres el único responsable de asegurarte de tener los permisos necesarios para cualquier uso más allá del uso justo o la visualización personal.",
    termsH3: "3. Descargo de Garantías:",
    terms3a:
      'Esta herramienta se proporciona "tal cual" sin ninguna garantía. No garantizamos la disponibilidad, precisión o confiabilidad del servicio ni que todas las resoluciones de miniaturas existan para cada video.',
    terms3b: "No estamos afiliados a YouTube ni a Google LLC.",
    termsH4: "4. Limitación de Responsabilidad:",
    terms4Text:
      "Esta herramienta no será responsable de ningún daño resultante del uso o la imposibilidad de usar este servicio.",
    termsH5: "5. Cambios a los Términos:",
    terms5Text: "Nos reservamos el derecho de modificar estos términos en cualquier momento.",
    feedbackCopied: "¡URL de la imagen copiada!",
    feedbackCopyFail: "Error al copiar la URL.",
    feedbackInvalidUrl: "Formato de URL de YouTube inválido. Por favor, pega la URL completa del video.",
    feedbackNoUrl: "Por favor, pega primero una URL de YouTube.",
    feedbackLoadError: "No se pudieron cargar las miniaturas. El video podría ser privado o estar eliminado.",
    feedbackUnexpectedError: "Ocurrió un error inesperado.",
    resMaxHd: "Max HD (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // --- French (Default Language) ---
  fr: {
    siteTitle: "Téléchargeur de Miniatures YouTube",
    modeLabel: "Mode",
    mainHeadline: "Téléchargeur de Miniatures YouTube",
    introParagraph:
      "Téléchargez rapidement la miniature de n'importe quelle vidéo YouTube en haute définition (HD), définition standard (SD) et autres tailles disponibles. Collez simplement le lien de la vidéo ci-dessous et cliquez sur 'Obtenir les miniatures' – c'est aussi simple que ça !",
    urlPlaceholder: "Collez l'URL de la vidéo YouTube (ex: https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "Obtenir les miniatures",
    resultsTitle: "Miniatures disponibles",
    downloadBtn: "Télécharger",
    copyUrlBtn: "Copier l'URL",
    howToTitle: "Comment utiliser cet outil",
    step1: "Trouvez la vidéo YouTube dont vous souhaitez télécharger la miniature.",
    step2:
      "Copiez l'URL complète (adresse web) de la vidéo depuis la barre d'adresse de votre navigateur ou les options de partage de l'application YouTube.",
    step3: "Collez l'URL copiée dans le champ de saisie prévu ci-dessus sur cette page.",
    step4: 'Cliquez sur le bouton "',
    step4cont: '".',
    step5: "L'outil affichera instantanément toutes les résolutions de miniatures disponibles pour cette vidéo.",
    step6: "Choisissez la taille de miniature souhaitée et la méthode de téléchargement :",
    step6a: 'Cliquez sur le bouton "',
    step6acont: '" pour enregistrer l\'image directement sur votre appareil.', // Escaped the apostrophe
    step6b: 'Cliquez sur le bouton "',
    step6bcont:
    '" pour copier le lien de l\'image afin de l\'intégrer dans des sites web, des documents ou de le partager sur les réseaux sociaux.',
    step7:
      'Pour de meilleurs résultats, choisissez la plus haute résolution disponible (généralement "Max HD") sauf si vous avez besoin d\'une taille spécifique pour votre projet.',
    howToTip:
      "<strong>Astuce :</strong> Vous pouvez aussi utiliser cet outil sur mobile ! Partagez simplement le lien de la vidéo YouTube depuis l'application YouTube vers votre navigateur, puis collez-le ici.",
    whyTitle: "Pourquoi utiliser notre téléchargeur ?",
    whyIntro: "Notre téléchargeur de miniatures YouTube se distingue des autres outils par ces avantages clés :",
    why1strong: "Rapide et facile",
    why1text: "Obtenez des miniatures en quelques secondes par un simple copier-coller. Aucune étape complexe requise.",
    why2strong: "Haute qualité",
    why2text: "Téléchargez les miniatures dans les plus hautes résolutions disponibles, y compris HD (1280x720) lorsque disponible.",
    why3strong: "Résolutions multiples",
    why3text: "Nous proposons des options pour différentes tailles (HD, SD, HQ, MQ) afin que vous puissiez choisir celle qui convient parfaitement.",
    why4strong: "Entièrement gratuit",
    why4text: "Ceci est un outil gratuit pour tout le monde. Pas de coûts cachés ni d'inscription nécessaire pour télécharger des miniatures YouTube.",
    why5strong: "Aucune installation de logiciel",
    why5text: "Fonctionne directement dans votre navigateur web sur n'importe quel appareil (ordinateur, tablette, mobile).",
    why6strong: "Propre et sécurisé",
    why6text:
      "Nous privilégions une expérience simple et récupérons les images directement depuis les serveurs sécurisés de YouTube (img.youtube.com).",
    whyConclusion:
      "Cet extracteur de miniatures YouTube est idéal pour les créateurs de contenu, les gestionnaires de médias sociaux, les designers ou toute personne ayant besoin d'un accès rapide aux miniatures vidéo.",
    whyUseCasesTitle: "Cas d'utilisation populaires :",
    useCase1: "Créer des miniatures vidéo pour votre propre contenu",
    useCase2: "Rechercher les tendances en matière de conception de miniatures",
    useCase3: "Enregistrer des miniatures pour des présentations éducatives",
    useCase4: "Construire des bibliothèques de contenu et des planches d'inspiration",
    useCase5: "Analyser les miniatures des concurrents pour la recherche marketing",
    faqTitle: "Foire Aux Questions (FAQ)",
    faqQ1: "Comment télécharger une miniature YouTube ?",
    faqA1:
      'Collez simplement l\'URL complète de la vidéo YouTube dans le champ de saisie sur cette page et cliquez sur "Obtenir les miniatures". Nous afficherons toutes les tailles disponibles (HD, SD, etc.), et vous pourrez cliquer sur le bouton "Télécharger" pour celle que vous voulez. L\'image sera enregistrée dans le dossier de téléchargement par défaut de votre appareil.',
    faqQ2: "Quelles résolutions de miniatures puis-je télécharger ?",
    faqA2:
      "Nous tentons de récupérer plusieurs résolutions de miniatures standard de YouTube : Maximum Haute Définition (Maxres/1280x720, si disponible), Définition Standard (SD/640x480), Haute Qualité (HQ/480x360) et Qualité Moyenne (MQ/320x180). La plus haute qualité (Maxres HD) n'est pas toujours générée par YouTube pour chaque vidéo, surtout pour les contenus anciens ou moins populaires.",
    faqQ3: "L'utilisation de ce téléchargeur de miniatures YouTube est-elle gratuite ?",
    faqA3:
      "Oui, cet outil est entièrement gratuit. Vous pouvez télécharger autant de miniatures que vous le souhaitez sans frais ni inscription. Nous ne demandons pas de création de compte, d'adresse e-mail ou d'informations personnelles.",
    faqQ4: "Puis-je télécharger des miniatures de vidéos privées ?",
    faqA4:
      "Non, cet outil ne peut récupérer que les miniatures des vidéos YouTube accessibles au public. Les miniatures des vidéos privées ou non répertoriées nécessitant une connexion ne peuvent pas être consultées. C'est une limitation de la plateforme YouTube, pas de notre outil.",
    faqQ5: "Y a-t-il des restrictions de droits d'auteur sur les miniatures téléchargées ?",
    faqA5:
      "Oui. Les miniatures YouTube sont généralement protégées par le droit d'auteur, soit par YouTube, soit par le créateur de la vidéo. Vous ne devez utiliser les miniatures téléchargées que dans le respect des lois sur le droit d'auteur et des Conditions d'utilisation de YouTube. Les utiliser pour votre propre contenu sans autorisation peut constituer une contrefaçon. Cet outil est fourni pour des raisons de commodité (par exemple, aperçu, sauvegarde personnelle, contextes d'utilisation équitable), mais vous êtes responsable de l'utilisation que vous faites des images.",
    faqQ6: "Pourquoi la miniature HD (1280x720) est-elle parfois manquante ?",
    faqA6:
      "YouTube ne génère pas automatiquement la miniature `maxresdefault.jpg` (HD 1280x720) pour chaque vidéo. Elle est plus courante sur les vidéos populaires ou récemment mises en ligne. Si elle n'est pas disponible, la `sddefault.jpg` (640x480) est généralement la meilleure qualité suivante.",
    faqQ7: "Puis-je utiliser cet outil sur mon appareil mobile ?",
    faqA7:
      "Notre outil fonctionne sur n'importe quel appareil doté d'un navigateur web, y compris les smartphones et les tablettes. La conception adaptative garantit une expérience fluide quelle que soit la taille de l'écran.",
    faqQ8: "Comment puis-je utiliser les miniatures téléchargées ?",
    faqA8:
       "Les miniatures téléchargées peuvent être utilisées à diverses fins telles que la création de listes de lecture vidéo, d'articles de blog, de présentations, de recherches ou de collections personnelles. N'oubliez pas de respecter les droits d'auteur lors de l'utilisation de miniatures à des fins publiques ou commerciales.",
    faqQ9: "Cet outil fonctionne-t-il avec les YouTube Shorts ?",
    faqA9:
      "Oui, notre outil fonctionne également avec les YouTube Shorts. Collez simplement l'URL du Short YouTube, et nous extrairons les miniatures disponibles comme pour les vidéos YouTube classiques.",
    footerAbout: "À propos",
    footerPrivacy: "Politique de confidentialité",
    footerTerms: "Conditions d'utilisation",
    footerFaq: "FAQ",
    siteTitleFooter: "Téléchargeur de Miniatures YouTube",
    footerRights: "Tous droits réservés.",
    footerDisclaimer:
      "Avertissement : Les miniatures téléchargées sont soumises aux droits d'auteur de YouTube et du créateur. Utilisez-les de manière responsable.",
    aboutTitle: "À propos de cet outil",
    aboutP1: "Bienvenue ! Voici votre outil simple et efficace pour télécharger les miniatures des vidéos YouTube.",
    aboutP2:
      "Nous avons créé cet outil pour offrir aux créateurs de contenu, aux spécialistes du marketing et à toute personne intéressée un moyen rapide et facile de récupérer des miniatures de haute qualité à partir de vidéos YouTube. Que vous ayez besoin d'inspiration, d'espaces réservés ou que vous archiviez du contenu, cet outil vous fournit les images dont vous avez besoin sans tracas.",
    aboutP3:
      'Collez simplement l\'URL de la vidéo YouTube dans le champ de saisie, cliquez sur "Obtenir les miniatures" et choisissez la résolution qui correspond le mieux à vos besoins. Vous pouvez facilement télécharger l\'image ou copier son URL.',
    aboutP4: "Notre objectif est de maintenir cet outil rapide, fiable et convivial. Nous espérons qu'il vous sera utile !",
    aboutP5Strong: "Veuillez noter :",
    aboutP5Text:
      "Les miniatures sont la propriété de leurs détenteurs respectifs. Veuillez utiliser cet outil de manière responsable et respecter les réglementations sur les droits d'auteur ainsi que les Conditions d'utilisation de YouTube.",
    privacyTitle: "Politique de confidentialité",
    privacyP1: "Votre vie privée est importante pour nous. Cette politique de confidentialité explique comment cet outil traite les informations.",
    privacyHInfo: "Informations que nous traitons :",
    privacyInfo1Strong: "URL YouTube :",
    privacyInfo1Text:
      "Nous traitons les URL YouTube que vous saisissez uniquement pour récupérer les miniatures vidéo correspondantes depuis les serveurs d'images publiquement accessibles de YouTube (img.youtube.com). Nous ne stockons pas ces URL après le traitement de votre demande.",
    privacyInfo2Strong: "Données d'utilisation :",
    privacyInfo2Text:
      "Nous ne collectons pas d'informations d'identification personnelle. Nous pouvons utiliser des analyses de base et anonymes (comme les pages vues ou l'utilisation des fonctionnalités, si implémentées) pour comprendre l'utilisation et améliorer le service, mais cela n'est pas lié aux individus.",
    privacyInfo3Strong: "Cookies/Stockage local :",
    privacyInfo3Text:
      "Nous utilisons `localStorage` uniquement pour mémoriser votre préférence de langue et de mode clair/sombre. Aucun autre cookie de suivi n'est utilisé.",
    privacyHUse: "Comment nous utilisons les informations :",
    privacyUse1: "Pour fournir la fonctionnalité principale du téléchargeur de miniatures.",
    privacyUse2: "Pour améliorer l'expérience utilisateur (par ex., mémoriser le mode sombre, la langue).",
    privacyHShare: "Partage d'informations :",
    privacyShareText: "Nous ne vendons ni ne partageons aucune information fournie par l'utilisateur ou de données identifiables avec des tiers.",
    privacyHSecurity: "Sécurité :",
    privacySecurityText: "Les images miniatures sont récupérées directement depuis les serveurs sécurisés (HTTPS) de YouTube.",
    privacyHChanges: "Modifications de cette politique :",
    privacyChangesText: "Nous pouvons mettre à jour cette politique de confidentialité occasionnellement. Nous vous encourageons à la consulter périodiquement.",
    termsTitle: "Conditions d'utilisation",
    termsP1:
      "Bienvenue ! En utilisant notre site web et nos services, vous acceptez de vous conformer et d'être lié par les termes et conditions suivants.",
    termsH1: "1. Utilisation du Service :",
    terms1a:
      "Cet outil permet d'accéder et de visualiser les images miniatures publiquement disponibles associées aux vidéos YouTube.",
    terms1b:
      "Ce service est destiné à un usage personnel et non commercial, tel que l'aperçu, la référence ou la création de sauvegardes pour du contenu que vous possédez ou avez le droit d'utiliser (usage équitable).",
    terms1c:
      "Vous acceptez de ne pas utiliser ce service à des fins illégales, y compris la violation des droits d'auteur, ou de toute manière qui enfreint les Conditions d'utilisation de YouTube.",
    termsH2: "2. Propriété Intellectuelle :",
    terms2a: "Les images miniatures récupérées appartiennent à YouTube ou aux créateurs de contenu respectifs.",
    terms2b:
      "Cet outil ne vous accorde aucun droit sur ces images. Vous êtes seul responsable de vous assurer que vous disposez des autorisations nécessaires pour toute utilisation au-delà de l'usage équitable ou de la visualisation personnelle.",
    termsH3: "3. Exonération de Garanties :",
    terms3a:
      'Cet outil est fourni "tel quel" sans aucune garantie. Nous ne garantissons pas la disponibilité, l\'exactitude ou la fiabilité du service, ni que toutes les résolutions de miniatures existeront pour chaque vidéo.',
    terms3b: "Nous ne sommes pas affiliés à YouTube ou Google LLC.",
    termsH4: "4. Limitation de Responsabilité :",
    terms4Text:
      "Cet outil ne sera pas responsable des dommages résultant de l'utilisation ou de l'impossibilité d'utiliser ce service.",
    termsH5: "5. Modifications des Conditions :",
    terms5Text: "Nous nous réservons le droit de modifier ces conditions à tout moment.",
    feedbackCopied: "URL de l'image copiée !",
    feedbackCopyFail: "Échec de la copie de l'URL.",
    feedbackInvalidUrl: "Format d'URL YouTube invalide. Veuillez coller l'URL complète de la vidéo.",
    feedbackNoUrl: "Veuillez d'abord coller une URL YouTube.",
    feedbackLoadError: "Impossible de charger les miniatures. La vidéo est peut-être privée ou supprimée.",
    feedbackUnexpectedError: "Une erreur inattendue s'est produite.",
    resMaxHd: "Max HD (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // --- German ---
  de: {
    siteTitle: "YouTube Thumbnail Downloader",
    modeLabel: "Modus",
    mainHeadline: "YouTube Thumbnail Downloader",
    introParagraph:
      "Laden Sie schnell das Thumbnail eines beliebigen YouTube-Videos in beeindruckender High-Definition (HD), Standard-Definition (SD) und anderen verfügbaren Größen herunter. Fügen Sie einfach den Videolink unten ein und klicken Sie auf 'Thumbnails holen' – so einfach ist das!",
    urlPlaceholder: "YouTube-Video-URL einfügen (z.B. https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "Thumbnails holen",
    resultsTitle: "Verfügbare Thumbnails",
    downloadBtn: "Herunterladen",
    copyUrlBtn: "URL kopieren",
    howToTitle: "So verwenden Sie dieses Tool",
    step1: "Finden Sie das YouTube-Video, dessen Thumbnail Sie herunterladen möchten.",
    step2:
      "Kopieren Sie die vollständige URL (Webadresse) des Videos aus der Adressleiste Ihres Browsers oder den Freigabeoptionen der YouTube-App.",
    step3: "Fügen Sie die kopierte URL in das oben auf dieser Seite bereitgestellte Eingabefeld ein.",
    step4: 'Klicken Sie auf die Schaltfläche "',
    step4cont: '".',
    step5: "Das Tool zeigt sofort alle verfügbaren Thumbnail-Auflösungen für dieses Video an.",
    step6: "Wählen Sie die gewünschte Thumbnail-Größe und Download-Methode:",
    step6a: 'Klicken Sie auf die Schaltfläche "',
    step6acont: '", um das Bild direkt auf Ihrem Gerät zu speichern.',
    step6b: 'Klicken Sie auf die Schaltfläche "',
    step6bcont:
      '", um den Bildlink zum Einbetten in Websites, Dokumente oder zum Teilen in sozialen Medien zu kopieren.',
    step7:
      'Für beste Ergebnisse wählen Sie die höchste verfügbare Auflösung (normalerweise "Max HD"), es sei denn, Sie benötigen eine bestimmte Größe für Ihr Projekt.',
    howToTip:
      "<strong>Profi-Tipp:</strong> Sie können dieses Tool auch auf Mobilgeräten verwenden! Teilen Sie einfach den YouTube-Videolink aus der YouTube-App in Ihren Browser und fügen Sie ihn hier ein.",
    whyTitle: "Warum unseren Downloader verwenden?",
    whyIntro: "Unser YouTube-Thumbnail-Downloader hebt sich durch diese Hauptvorteile von anderen Tools ab:",
    why1strong: "Schnell und einfach",
    why1text: "Erhalten Sie Thumbnails in Sekunden mit einer einfachen Kopier-Einfüge-Aktion. Keine komplexen Schritte erforderlich.",
    why2strong: "Hohe Qualität",
    why2text: "Laden Sie Thumbnails in den höchsten verfügbaren Auflösungen herunter, einschließlich HD (1280x720), sofern verfügbar.",
    why3strong: "Mehrere Auflösungen",
    why3text: "Wir bieten Optionen für verschiedene Größen (HD, SD, HQ, MQ), damit Sie die perfekte Passform auswählen können.",
    why4strong: "Vollständig kostenlos",
    why4text: "Dies ist ein kostenloses Tool für jedermann. Keine versteckten Kosten oder Anmeldungen erforderlich, um YouTube-Thumbnails herunterzuladen.",
    why5strong: "Keine Softwareinstallation",
    why5text: "Funktioniert direkt in Ihrem Webbrowser auf jedem Gerät (Desktop, Tablet, Mobilgerät).",
    why6strong: "Sauber und sicher",
    why6text:
      "Wir legen Wert auf eine einfache Erfahrung und rufen Bilder direkt von den sicheren Servern von YouTube (img.youtube.com) ab.",
    whyConclusion:
      "Dieser YouTube-Thumbnail-Grabber ist ideal für Content-Ersteller, Social-Media-Manager, Designer oder jeden, der schnellen Zugriff auf Video-Thumbnails benötigt.",
    whyUseCasesTitle: "Beliebte Anwendungsfälle:",
    useCase1: "Erstellen von Video-Thumbnails für eigene Inhalte",
    useCase2: "Recherche nach Thumbnail-Designtrends",
    useCase3: "Speichern von Thumbnails für Bildungspräsentationen",
    useCase4: "Aufbau von Inhaltsbibliotheken und Moodboards",
    useCase5: "Analyse von Konkurrenz-Thumbnails für Marktforschung",
    faqTitle: "Häufig gestellte Fragen (FAQ)",
    faqQ1: "Wie lade ich ein YouTube-Thumbnail herunter?",
    faqA1:
      'Fügen Sie einfach die vollständige YouTube-Video-URL in das Eingabefeld auf dieser Seite ein und klicken Sie auf "Thumbnails holen". Wir zeigen Ihnen alle verfügbaren Größen (HD, SD usw.), und Sie können auf die Schaltfläche "Herunterladen" für die gewünschte Größe klicken. Das Bild wird am Standardspeicherort Ihres Geräts gespeichert.',
    faqQ2: "Welche Thumbnail-Auflösungen kann ich herunterladen?",
    faqA2:
      "Wir versuchen, mehrere Standard-YouTube-Thumbnail-Auflösungen abzurufen: Maximale High Definition (Maxres/1280x720, falls verfügbar), Standard Definition (SD/640x480), High Quality (HQ/480x360) und Medium Quality (MQ/320x180). Die höchste Qualität (Maxres HD) wird nicht immer von YouTube für jedes Video generiert, insbesondere bei älteren oder weniger beliebten Inhalten.",
    faqQ3: "Ist die Nutzung dieses YouTube-Thumbnail-Downloaders kostenlos?",
    faqA3:
      "Ja, dieses Tool ist völlig kostenlos. Sie können so viele Thumbnails herunterladen, wie Sie benötigen, ohne Gebühren oder Registrierung. Wir benötigen keine Kontoerstellung, E-Mail-Adressen oder persönliche Informationen.",
    faqQ4: "Kann ich Thumbnails für private Videos herunterladen?",
    faqA4:
      "Nein, dieses Tool kann nur Thumbnails für öffentlich zugängliche YouTube-Videos abrufen. Thumbnails für private oder nicht gelistete Videos, die eine Anmeldung erfordern, können nicht abgerufen werden. Dies ist eine Einschränkung der YouTube-Plattform, nicht unseres Tools.",
    faqQ5: "Gibt es Urheberrechtsbeschränkungen für heruntergeladene Thumbnails?",
    faqA5:
      "Ja. YouTube-Thumbnails sind in der Regel urheberrechtlich geschützt, entweder durch YouTube oder den Videoersteller. Sie sollten heruntergeladene Thumbnails nur auf eine Weise verwenden, die die Urheberrechtsgesetze und die Nutzungsbedingungen von YouTube respektiert. Die Verwendung für eigene Inhalte ohne Erlaubnis kann eine Verletzung darstellen. Dieses Tool wird zur Vereinfachung bereitgestellt (z. B. Vorschau, persönliche Sicherung, Fair-Use-Kontexte), aber Sie sind dafür verantwortlich, wie Sie die Bilder verwenden.",
    faqQ6: "Warum fehlt manchmal das HD-Thumbnail (1280x720)?",
    faqA6:
      "YouTube generiert nicht automatisch das `maxresdefault.jpg` (HD 1280x720) Thumbnail für jedes einzelne Video. Es ist häufiger bei beliebten oder neuer hochgeladenen Videos vorhanden. Wenn es nicht verfügbar ist, ist `sddefault.jpg` (640x480) normalerweise die nächstbeste Qualität.",
    faqQ7: "Kann ich dieses Tool auf meinem Mobilgerät verwenden?",
    faqA7:
      "Unser Tool funktioniert auf jedem Gerät mit einem Webbrowser, einschließlich Smartphones und Tablets. Das responsive Design gewährleistet eine reibungslose Erfahrung unabhängig von der Bildschirmgröße.",
    faqQ8: "Wie kann ich die heruntergeladenen Thumbnails verwenden?",
    faqA8:
       "Heruntergeladene Thumbnails können für verschiedene Zwecke verwendet werden, z. B. zum Erstellen von Video-Wiedergabelisten, Blog-Posts, Präsentationen, Recherchen oder persönlichen Sammlungen. Denken Sie daran, das Urheberrecht zu beachten, wenn Sie Thumbnails für öffentliche oder kommerzielle Zwecke verwenden.",
    faqQ9: "Funktioniert dieses Tool mit YouTube Shorts?",
    faqA9:
      "Ja, unser Tool funktioniert auch mit YouTube Shorts. Fügen Sie einfach die YouTube Shorts-URL ein, und wir extrahieren die verfügbaren Thumbnails genau wie bei regulären YouTube-Videos.",
    footerAbout: "Über uns",
    footerPrivacy: "Datenschutzrichtlinie",
    footerTerms: "Nutzungsbedingungen",
    footerFaq: "FAQ",
    siteTitleFooter: "YouTube Thumbnail Downloader",
    footerRights: "Alle Rechte vorbehalten.",
    footerDisclaimer:
      "Haftungsausschluss: Heruntergeladene Thumbnails unterliegen dem Urheberrecht von YouTube und dem Ersteller. Verantwortungsvoll verwenden.",
    aboutTitle: "Über dieses Tool",
    aboutP1: "Willkommen! Dies ist Ihr einfaches und effizientes Tool zum Herunterladen von YouTube-Video-Thumbnails.",
    aboutP2:
      "Wir haben dieses Tool entwickelt, um Content-Erstellern, Vermarktern und allen Interessierten eine schnelle und einfache Möglichkeit zu bieten, hochwertige Thumbnails von YouTube-Videos zu erhalten. Egal, ob Sie Inspiration, Platzhalter benötigen oder Inhalte archivieren, dieses Tool liefert Ihnen die benötigten Bilder ohne Aufwand.",
    aboutP3:
      'Fügen Sie einfach die YouTube-Video-URL in das Eingabefeld ein, klicken Sie auf "Thumbnails holen" und wählen Sie die Auflösung, die Ihren Anforderungen am besten entspricht. Sie können das Bild einfach herunterladen oder seine URL kopieren.',
    aboutP4: "Unser Ziel ist es, dieses Tool schnell, zuverlässig und benutzerfreundlich zu halten. Wir hoffen, Sie finden es nützlich!",
    aboutP5Strong: "Bitte beachten Sie:",
    aboutP5Text:
      "Thumbnails sind Eigentum ihrer jeweiligen Inhaber. Bitte verwenden Sie dieses Tool verantwortungsbewusst und respektieren Sie die Urheberrechtsbestimmungen und die Nutzungsbedingungen von YouTube.",
    privacyTitle: "Datenschutzrichtlinie",
    privacyP1: "Ihre Privatsphäre ist uns wichtig. Diese Datenschutzrichtlinie erläutert, wie dieses Tool Informationen behandelt.",
    privacyHInfo: "Informationen, die wir behandeln:",
    privacyInfo1Strong: "YouTube-URLs:",
    privacyInfo1Text:
      "Wir verarbeiten die von Ihnen eingegebenen YouTube-URLs ausschließlich, um die entsprechenden Video-Thumbnails von den öffentlich zugänglichen Bildservern von YouTube (img.youtube.com) abzurufen. Wir speichern diese URLs nicht, nachdem Ihre Anfrage bearbeitet wurde.",
    privacyInfo2Strong: "Nutzungsdaten:",
    privacyInfo2Text:
      "Wir sammeln keine personenbezogenen Daten. Wir können grundlegende, anonyme Analysen (wie Seitenaufrufe oder Funktionsnutzung, falls implementiert) verwenden, um die Nutzung zu verstehen und den Dienst zu verbessern, dies ist jedoch nicht mit Einzelpersonen verknüpft.",
    privacyInfo3Strong: "Cookies/Lokaler Speicher:",
    privacyInfo3Text:
      "Wir verwenden `localStorage` nur, um Ihre Präferenz für Sprache und Hell-/Dunkelmodus zu speichern. Es werden keine anderen Tracking-Cookies verwendet.",
    privacyHUse: "Wie wir Informationen verwenden:",
    privacyUse1: "Um die Kernfunktionalität des Thumbnail-Downloaders bereitzustellen.",
    privacyUse2: "Um die Benutzererfahrung zu verbessern (z. B. Speichern des Dunkelmodus, der Sprache).",
    privacyHShare: "Informationsweitergabe:",
    privacyShareText: "Wir verkaufen oder teilen keine vom Benutzer bereitgestellten Informationen oder identifizierbaren Daten mit Dritten.",
    privacyHSecurity: "Sicherheit:",
    privacySecurityText: "Thumbnail-Bilder werden direkt von den sicheren (HTTPS-)Servern von YouTube abgerufen.",
    privacyHChanges: "Änderungen an dieser Richtlinie:",
    privacyChangesText: "Wir können diese Datenschutzrichtlinie gelegentlich aktualisieren. Wir empfehlen Ihnen, sie regelmäßig zu überprüfen.",
    termsTitle: "Nutzungsbedingungen",
    termsP1:
      "Willkommen! Durch die Nutzung unserer Website und Dienste erklären Sie sich damit einverstanden, die folgenden Bedingungen einzuhalten und an diese gebunden zu sein.",
    termsH1: "1. Nutzung des Dienstes:",
    terms1a:
      "Dieses Tool bietet eine Möglichkeit, öffentlich verfügbare Thumbnail-Bilder anzuzeigen, die mit YouTube-Videos verknüpft sind.",
    terms1b:
      "Dieser Dienst ist für den persönlichen, nicht kommerziellen Gebrauch bestimmt, z. B. zur Vorschau, Referenzierung oder Erstellung von Sicherungskopien für Inhalte, die Sie besitzen oder für die Sie Nutzungsrechte haben (Fair Use).",
    terms1c:
      "Sie erklären sich damit einverstanden, diesen Dienst nicht für rechtswidrige Zwecke, einschließlich Urheberrechtsverletzungen, oder in einer Weise zu nutzen, die gegen die Nutzungsbedingungen von YouTube verstößt.",
    termsH2: "2. Geistiges Eigentum:",
    terms2a: "Die abgerufenen Thumbnail-Bilder gehören YouTube oder den jeweiligen Content-Erstellern.",
    terms2b:
      "Dieses Tool gewährt Ihnen keine Rechte an diesen Bildern. Sie sind allein dafür verantwortlich sicherzustellen, dass Sie über die erforderlichen Berechtigungen für jede Nutzung verfügen, die über Fair Use oder die persönliche Betrachtung hinausgeht.",
    termsH3: "3. Gewährleistungsausschluss:",
    terms3a:
      'Dieses Tool wird "wie besehen" ohne jegliche Gewährleistung bereitgestellt. Wir garantieren nicht die Verfügbarkeit, Genauigkeit oder Zuverlässigkeit des Dienstes oder dass alle Thumbnail-Auflösungen für jedes Video existieren.',
    terms3b: "Wir sind nicht mit YouTube oder Google LLC verbunden.",
    termsH4: "4. Haftungsbeschränkung:",
    terms4Text:
      "Dieses Tool haftet nicht für Schäden, die sich aus der Nutzung oder Unmöglichkeit der Nutzung dieses Dienstes ergeben.",
    termsH5: "5. Änderungen der Bedingungen:",
    terms5Text: "Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern.",
    feedbackCopied: "Bild-URL kopiert!",
    feedbackCopyFail: "Kopieren der URL fehlgeschlagen.",
    feedbackInvalidUrl: "Ungültiges YouTube-URL-Format. Bitte fügen Sie die vollständige Video-URL ein.",
    feedbackNoUrl: "Bitte fügen Sie zuerst eine YouTube-URL ein.",
    feedbackLoadError: "Es konnten keine Thumbnails geladen werden. Das Video ist möglicherweise privat oder gelöscht.",
    feedbackUnexpectedError: "Ein unerwarteter Fehler ist aufgetreten.",
    resMaxHd: "Max HD (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // --- Italian ---
  it: {
    siteTitle: "Downloader Miniature YouTube",
    modeLabel: "Modalità",
    mainHeadline: "Downloader Miniature YouTube",
    introParagraph:
      "Scarica rapidamente la miniatura di qualsiasi video di YouTube in alta definizione (HD), definizione standard (SD) e altre dimensioni disponibili. Basta incollare il link del video qui sotto e fare clic su 'Ottieni Miniature' – è semplicissimo!",
    urlPlaceholder: "Incolla l'URL del video di YouTube (es. https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "Ottieni Miniature",
    resultsTitle: "Miniature Disponibili",
    downloadBtn: "Scarica",
    copyUrlBtn: "Copia URL",
    howToTitle: "Come Usare Questo Strumento",
    step1: "Trova il video di YouTube di cui vuoi scaricare la miniatura.",
    step2:
      "Copia l'URL completo (indirizzo web) del video dalla barra degli indirizzi del tuo browser o dalle opzioni di condivisione dell'app YouTube.",
    step3: "Incolla l'URL copiato nella casella di input fornita sopra in questa pagina.",
    step4: 'Fai clic sul pulsante "',
    step4cont: '".',
    step5: "Lo strumento visualizzerà istantaneamente tutte le risoluzioni delle miniature disponibili per quel video.",
    step6: "Scegli la dimensione della miniatura desiderata e il metodo di download:",
    step6a: 'Fai clic sul pulsante "',
    step6acont: '" per salvare l\'immagine direttamente sul tuo dispositivo.', // Escaped the apostrophe
    step6b: 'Fai clic sul pulsante "',
    step6bcont: '" per copiare il link dell\'immagine per incorporarlo in siti web, documenti o condividerlo sui social media.',
    step7:
      'Per ottenere i migliori risultati, scegli la risoluzione più alta disponibile (di solito "Max HD") a meno che tu non abbia bisogno di una dimensione specifica per il tuo progetto.',
    howToTip:
      "<strong>Suggerimento Pro:</strong> Puoi usare questo strumento anche sui dispositivi mobili! Condividi semplicemente il link del video di YouTube dall'app YouTube al tuo browser, poi incollalo qui.",
    whyTitle: "Perché Usare il Nostro Downloader?",
    whyIntro: "Il nostro downloader di miniature di YouTube si distingue dagli altri strumenti per questi vantaggi chiave:",
    why1strong: "Veloce e Facile",
    why1text: "Ottieni miniature in pochi secondi con una semplice azione di copia-incolla. Non sono richiesti passaggi complessi.",
    why2strong: "Alta Qualità",
    why2text: "Scarica miniature nelle risoluzioni più alte disponibili, inclusa l'HD (1280x720) quando disponibile.",
    why3strong: "Risoluzioni Multiple",
    why3text: "Forniamo opzioni per varie dimensioni (HD, SD, HQ, MQ) in modo da poter scegliere la misura perfetta.",
    why4strong: "Completamente Gratuito",
    why4text: "Questo è uno strumento gratuito per tutti. Nessun costo nascosto o registrazione necessaria per scaricare le miniature di YouTube.",
    why5strong: "Nessuna Installazione Software",
    why5text: "Funziona direttamente nel tuo browser web su qualsiasi dispositivo (desktop, tablet, mobile).",
    why6strong: "Pulito e Sicuro",
    why6text:
      "Diamo priorità a un'esperienza semplice e recuperiamo le immagini direttamente dai server sicuri di YouTube (img.youtube.com).",
    whyConclusion:
      "Questo grabber di miniature di YouTube è ideale per creatori di contenuti, social media manager, designer o chiunque necessiti di un accesso rapido alle miniature dei video.",
    whyUseCasesTitle: "Casi d'Uso Popolari:",
    useCase1: "Creare miniature video per i propri contenuti",
    useCase2: "Ricercare le tendenze nel design delle miniature",
    useCase3: "Salvare miniature per presentazioni educative",
    useCase4: "Costruire librerie di contenuti e mood board",
    useCase5: "Analizzare le miniature dei concorrenti per ricerche di mercato",
    faqTitle: "Domande Frequenti (FAQ)",
    faqQ1: "Come scarico una miniatura di YouTube?",
    faqA1:
      'Basta incollare l\'URL completo del video di YouTube nella casella di input in questa pagina e fare clic su "Ottieni Miniature". Ti mostreremo tutte le dimensioni disponibili (HD, SD, ecc.) e potrai fare clic sul pulsante "Scarica" per quella che desideri. L\'immagine verrà salvata nella posizione di download predefinita del tuo dispositivo.',
    faqQ2: "Quali risoluzioni di miniature posso scaricare?",
    faqA2:
      "Tentiamo di recuperare diverse risoluzioni standard delle miniature di YouTube: Massima Alta Definizione (Maxres/1280x720, se disponibile), Definizione Standard (SD/640x480), Alta Qualità (HQ/480x360) e Media Qualità (MQ/320x180). La qualità più alta (Maxres HD) non viene sempre generata da YouTube per ogni video, specialmente per contenuti più vecchi o meno popolari.",
    faqQ3: "L'uso di questo downloader di miniature di YouTube è gratuito?",
    faqA3:
      "Sì, questo strumento è completamente gratuito. Puoi scaricare quante miniature desideri senza alcun costo o registrazione. Non richiediamo la creazione di account, indirizzi email o alcuna informazione personale.",
    faqQ4: "Posso scaricare miniature di video privati?",
    faqA4:
      "No, questo strumento può recuperare solo miniature di video di YouTube accessibili pubblicamente. Non è possibile accedere alle miniature di video privati o non in elenco che richiedono l'accesso. Questa è una limitazione della piattaforma YouTube, non del nostro strumento.",
    faqQ5: "Ci sono restrizioni sul copyright per le miniature scaricate?",
    faqA5:
      "Sì. Le miniature di YouTube sono tipicamente protette da copyright da parte di YouTube o del creatore del video. Dovresti usare le miniature scaricate solo in modi che rispettino le leggi sul copyright e i Termini di servizio di YouTube. Usarle per i tuoi contenuti senza permesso potrebbe costituire una violazione. Questo strumento è fornito per comodità (ad es. anteprima, backup personale, contesti di fair use), ma sei responsabile di come usi le immagini.",
    faqQ6: "Perché a volte manca la miniatura HD (1280x720)?",
    faqA6:
      "YouTube non genera automaticamente la miniatura `maxresdefault.jpg` (HD 1280x720) per ogni singolo video. È più comune sui video popolari o caricati più di recente. Se non è disponibile, `sddefault.jpg` (640x480) è solitamente la qualità successiva migliore.",
    faqQ7: "Posso usare questo strumento sul mio dispositivo mobile?",
    faqA7:
      "Il nostro strumento funziona su qualsiasi dispositivo con un browser web, inclusi smartphone e tablet. Il design responsive garantisce un'esperienza fluida indipendentemente dalle dimensioni dello schermo.",
    faqQ8: "Come posso usare le miniature scaricate?",
    faqA8:
       "Le miniature scaricate possono essere utilizzate per vari scopi come la creazione di playlist video, post di blog, presentazioni, ricerche o collezioni personali. Ricorda di rispettare il copyright quando usi le miniature per scopi pubblici o commerciali.",
    faqQ9: "Questo strumento funziona con YouTube Shorts?",
    faqA9:
      "Sì, il nostro strumento funziona anche con YouTube Shorts. Incolla semplicemente l'URL dello Short di YouTube e estrarremo le miniature disponibili proprio come con i video normali di YouTube.",
    footerAbout: "Chi siamo",
    footerPrivacy: "Informativa sulla privacy",
    footerTerms: "Termini di servizio",
    footerFaq: "FAQ",
    siteTitleFooter: "Downloader Miniature YouTube",
    footerRights: "Tutti i diritti riservati.",
    footerDisclaimer:
      "Disclaimer: Le miniature scaricate sono soggette ai diritti d'autore di YouTube e del creatore. Usare responsabilmente.",
    aboutTitle: "Informazioni su questo strumento",
    aboutP1: "Benvenuto! Questo è il tuo strumento semplice ed efficiente per scaricare le miniature dei video di YouTube.",
    aboutP2:
      "Abbiamo creato questo strumento per fornire un modo rapido e semplice a creatori di contenuti, marketer e chiunque sia interessato a ottenere miniature di alta qualità dai video di YouTube. Che tu abbia bisogno di ispirazione, segnaposto o stia archiviando contenuti, questo strumento ti fornisce le immagini di cui hai bisogno senza problemi.",
    aboutP3:
      'Basta incollare l\'URL del video di YouTube nella casella di input, fare clic su "Ottieni Miniature" e scegliere la risoluzione che meglio si adatta alle tue esigenze. Puoi facilmente scaricare l\'immagine o copiare il suo URL.',
    aboutP4: "Il nostro obiettivo è mantenere questo strumento veloce, affidabile e facile da usare. Speriamo che lo trovi utile!",
    aboutP5Strong: "Nota bene:",
    aboutP5Text:
      "Le miniature sono di proprietà dei rispettivi titolari. Si prega di utilizzare questo strumento in modo responsabile e di rispettare le normative sul copyright e i Termini di servizio di YouTube.",
    privacyTitle: "Informativa sulla privacy",
    privacyP1: "La tua privacy è importante per noi. Questa Informativa sulla privacy spiega come questo strumento gestisce le informazioni.",
    privacyHInfo: "Informazioni che gestiamo:",
    privacyInfo1Strong: "URL di YouTube:",
    privacyInfo1Text:
      "Elaboriamo gli URL di YouTube che inserisci esclusivamente per recuperare le miniature video corrispondenti dai server di immagini pubblicamente disponibili di YouTube (img.youtube.com). Non memorizziamo questi URL dopo aver elaborato la tua richiesta.",
    privacyInfo2Strong: "Dati di utilizzo:",
    privacyInfo2Text:
      "Non raccogliamo informazioni di identificazione personale. Possiamo utilizzare analisi di base e anonime (come visualizzazioni di pagina o utilizzo delle funzionalità, se implementate) per comprendere l'utilizzo e migliorare il servizio, ma questo non è collegato agli individui.",
    privacyInfo3Strong: "Cookie/Archiviazione locale:",
    privacyInfo3Text:
      "Utilizziamo `localStorage` solo per ricordare la tua preferenza per la lingua e la modalità chiara/scura. Non vengono utilizzati altri cookie di tracciamento.",
    privacyHUse: "Come utilizziamo le informazioni:",
    privacyUse1: "Per fornire la funzionalità principale del downloader di miniature.",
    privacyUse2: "Per migliorare l'esperienza utente (ad es. ricordare la modalità scura, la lingua).",
    privacyHShare: "Condivisione delle informazioni:",
    privacyShareText: "Non vendiamo né condividiamo alcuna informazione fornita dall'utente o dati identificabili con terze parti.",
    privacyHSecurity: "Sicurezza:",
    privacySecurityText: "Le immagini delle miniature vengono recuperate direttamente dai server sicuri (HTTPS) di YouTube.",
    privacyHChanges: "Modifiche a questa informativa:",
    privacyChangesText: "Potremmo aggiornare questa Informativa sulla privacy occasionalmente. Ti invitiamo a rivederla periodicamente.",
    termsTitle: "Termini di servizio",
    termsP1:
      "Benvenuto! Utilizzando il nostro sito web e i nostri servizi, accetti di rispettare e di essere vincolato dai seguenti termini e condizioni.",
    termsH1: "1. Uso del Servizio:",
    terms1a:
      "Questo strumento fornisce un modo per accedere e visualizzare immagini di miniature pubblicamente disponibili associate ai video di YouTube.",
    terms1b:
      "Questo servizio è destinato all'uso personale e non commerciale, come anteprima, riferimento o creazione di backup per contenuti di tua proprietà o per i quali hai i diritti d'uso (fair use).",
    terms1c:
      "Accetti di non utilizzare questo servizio per scopi illegali, inclusa la violazione del copyright, o in qualsiasi modo che violi i Termini di servizio di YouTube.",
    termsH2: "2. Proprietà Intellettuale:",
    terms2a: "Le immagini delle miniature recuperate appartengono a YouTube o ai rispettivi creatori di contenuti.",
    terms2b:
      "Questo strumento non ti concede alcun diritto su queste immagini. Sei l'unico responsabile di assicurarti di avere le autorizzazioni necessarie per qualsiasi uso oltre al fair use o alla visualizzazione personale.",
    termsH3: "3. Esclusione di Garanzie:",
    terms3a:
      'Questo strumento è fornito "così com\'è" senza alcuna garanzia. Non garantiamo la disponibilità, l\'accuratezza o l\'affidabilità del servizio o che tutte le risoluzioni delle miniature esistano per ogni video.',
    terms3b: "Non siamo affiliati a YouTube o Google LLC.",
    termsH4: "4. Limitazione di Responsabilità:",
    terms4Text:
      "Questo strumento non sarà responsabile per eventuali danni derivanti dall'uso o dall'impossibilità di utilizzare questo servizio.",
    termsH5: "5. Modifiche ai Termini:",
    terms5Text: "Ci riserviamo il diritto di modificare questi termini in qualsiasi momento.",
    feedbackCopied: "URL dell'immagine copiato!",
    feedbackCopyFail: "Copia dell'URL fallita.",
    feedbackInvalidUrl: "Formato URL di YouTube non valido. Incolla l'URL completo del video.",
    feedbackNoUrl: "Per favore, incolla prima un URL di YouTube.",
    feedbackLoadError: "Impossibile caricare le miniature. Il video potrebbe essere privato o eliminato.",
    feedbackUnexpectedError: "Si è verificato un errore imprevisto.",
    resMaxHd: "Max HD (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // --- Portuguese ---
  pt: {
    siteTitle: "Downloader de Miniaturas do YouTube",
    modeLabel: "Modo",
    mainHeadline: "Downloader de Miniaturas do YouTube",
    introParagraph:
      "Baixe rapidamente a miniatura de qualquer vídeo do YouTube em alta definição (HD), definição padrão (SD) e outros tamanhos disponíveis. Basta colar o link do vídeo abaixo e clicar em 'Obter Miniaturas' – é simples assim!",
    urlPlaceholder: "Cole o URL do vídeo do YouTube (ex: https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "Obter Miniaturas",
    resultsTitle: "Miniaturas Disponíveis",
    downloadBtn: "Baixar",
    copyUrlBtn: "Copiar URL",
    howToTitle: "Como Usar Esta Ferramenta",
    step1: "Encontre o vídeo do YouTube cuja miniatura você deseja baixar.",
    step2:
      "Copie o URL completo (endereço da web) do vídeo da barra de endereços do seu navegador ou das opções de compartilhamento do aplicativo do YouTube.",
    step3: "Cole o URL copiado na caixa de entrada fornecida acima nesta página.",
    step4: 'Clique no botão "',
    step4cont: '".',
    step5: "A ferramenta exibirá instantaneamente todas as resoluções de miniaturas disponíveis para esse vídeo.",
    step6: "Escolha o tamanho da miniatura desejado e o método de download:",
    step6a: 'Clique no botão "',
    step6acont: '" para salvar a imagem diretamente no seu dispositivo.',
    step6b: 'Clique no botão "',
    step6bcont: '" para copiar o link da imagem para incorporar em sites, documentos ou compartilhar nas redes sociais.',
    step7:
      'Para obter os melhores resultados, escolha a resolução mais alta disponível (geralmente "Max HD"), a menos que precise de um tamanho específico para o seu projeto.',
    howToTip:
      "<strong>Dica Pro:</strong> Você também pode usar esta ferramenta em dispositivos móveis! Basta compartilhar o link do vídeo do YouTube do aplicativo do YouTube para o seu navegador e, em seguida, colá-lo aqui.",
    whyTitle: "Por Que Usar Nosso Downloader?",
    whyIntro: "Nosso downloader de miniaturas do YouTube se destaca de outras ferramentas com estes benefícios principais:",
    why1strong: "Rápido e Fácil",
    why1text: "Obtenha miniaturas em segundos com uma simples ação de copiar e colar. Não são necessários passos complexos.",
    why2strong: "Alta Qualidade",
    why2text: "Baixe miniaturas nas resoluções mais altas disponíveis, incluindo HD (1280x720) quando disponível.",
    why3strong: "Múltiplas Resoluções",
    why3text: "Oferecemos opções para vários tamanhos (HD, SD, HQ, MQ) para que você possa escolher o ajuste perfeito.",
    why4strong: "Totalmente Gratuito",
    why4text: "Esta é uma ferramenta gratuita para todos. Sem custos ocultos ou necessidade de inscrição para baixar miniaturas do YouTube.",
    why5strong: "Sem Instalação de Software",
    why5text: "Funciona diretamente no seu navegador da web em qualquer dispositivo (desktop, tablet, celular).",
    why6strong: "Limpo e Seguro",
    why6text:
      "Priorizamos uma experiência simples e buscamos imagens diretamente dos servidores seguros do YouTube (img.youtube.com).",
    whyConclusion:
      "Este pegador de miniaturas do YouTube é ideal para criadores de conteúdo, gerentes de mídia social, designers ou qualquer pessoa que precise de acesso rápido às miniaturas de vídeo.",
    whyUseCasesTitle: "Casos de Uso Populares:",
    useCase1: "Criar miniaturas de vídeo para o seu próprio conteúdo",
    useCase2: "Pesquisar tendências de design de miniaturas",
    useCase3: "Salvar miniaturas para apresentações educacionais",
    useCase4: "Construir bibliotecas de conteúdo e painéis de inspiração",
    useCase5: "Analisar miniaturas de concorrentes para pesquisa de mercado",
    faqTitle: "Perguntas Frequentes (FAQ)",
    faqQ1: "Como faço para baixar uma miniatura do YouTube?",
    faqA1:
      'Basta colar o URL completo do vídeo do YouTube na caixa de entrada desta página e clicar em "Obter Miniaturas". Mostraremos todos os tamanhos disponíveis (HD, SD, etc.), e você pode clicar no botão "Baixar" para o que desejar. A imagem será salva no local de download padrão do seu dispositivo.',
    faqQ2: "Quais resoluções de miniaturas posso baixar?",
    faqA2:
      "Tentamos buscar várias resoluções padrão de miniaturas do YouTube: Máxima Alta Definição (Maxres/1280x720, se disponível), Definição Padrão (SD/640x480), Alta Qualidade (HQ/480x360) e Qualidade Média (MQ/320x180). A qualidade mais alta (Maxres HD) nem sempre é gerada pelo YouTube para cada vídeo, especialmente para conteúdo mais antigo ou menos popular.",
    faqQ3: "O uso deste downloader de miniaturas do YouTube é gratuito?",
    faqA3:
      "Sim, esta ferramenta é totalmente gratuita. Você pode baixar quantas miniaturas precisar sem qualquer custo ou registro. Não exigimos criação de conta, endereços de e-mail ou qualquer informação pessoal.",
    faqQ4: "Posso baixar miniaturas de vídeos privados?",
    faqA4:
      "Não, esta ferramenta só pode buscar miniaturas de vídeos do YouTube acessíveis publicamente. Miniaturas de vídeos privados ou não listados que exigem login não podem ser acessadas. Esta é uma limitação da plataforma do YouTube, não da nossa ferramenta.",
    faqQ5: "Existem restrições de direitos autorais sobre as miniaturas baixadas?",
    faqA5:
      "Sim. As miniaturas do YouTube são tipicamente protegidas por direitos autorais, seja pelo YouTube ou pelo criador do vídeo. Você só deve usar as miniaturas baixadas de forma a respeitar as leis de direitos autorais e os Termos de Serviço do YouTube. Usá-las para seu próprio conteúdo sem permissão pode constituir infração. Esta ferramenta é fornecida por conveniência (ex: visualização, backup pessoal, contextos de uso justo), mas você é responsável por como usa as imagens.",
    faqQ6: "Por que a miniatura HD (1280x720) às vezes está faltando?",
    faqA6:
      "O YouTube não gera automaticamente a miniatura `maxresdefault.jpg` (HD 1280x720) para cada vídeo. É mais comum em vídeos populares ou enviados mais recentemente. Se não estiver disponível, `sddefault.jpg` (640x480) geralmente é a próxima melhor qualidade.",
    faqQ7: "Posso usar esta ferramenta no meu dispositivo móvel?",
    faqA7:
      "Nossa ferramenta funciona em qualquer dispositivo com um navegador da web, incluindo smartphones e tablets. O design responsivo garante uma experiência tranquila, independentemente do tamanho da tela.",
    faqQ8: "Como posso usar as miniaturas baixadas?",
    faqA8:
       "As miniaturas baixadas podem ser usadas para diversos fins, como criar listas de reprodução de vídeos, posts de blog, apresentações, pesquisas ou coleções pessoais. Lembre-se de respeitar os direitos autorais ao usar miniaturas para fins públicos ou comerciais.",
    faqQ9: "Esta ferramenta funciona com YouTube Shorts?",
    faqA9:
      "Sim, nossa ferramenta também funciona com YouTube Shorts. Basta colar o URL do Short do YouTube e extrairemos as miniaturas disponíveis, assim como nos vídeos regulares do YouTube.",
    footerAbout: "Sobre Nós",
    footerPrivacy: "Política de Privacidade",
    footerTerms: "Termos de Serviço",
    footerFaq: "FAQ",
    siteTitleFooter: "Downloader de Miniaturas do YouTube",
    footerRights: "Todos os direitos reservados.",
    footerDisclaimer:
      "Aviso: As miniaturas baixadas estão sujeitas aos direitos autorais do YouTube e do criador. Use com responsabilidade.",
    aboutTitle: "Sobre Esta Ferramenta",
    aboutP1: "Bem-vindo! Esta é a sua ferramenta simples e eficiente para baixar miniaturas de vídeos do YouTube.",
    aboutP2:
      "Criamos esta ferramenta para fornecer uma maneira rápida e fácil para criadores de conteúdo, profissionais de marketing e qualquer pessoa interessada em obter miniaturas de alta qualidade de vídeos do YouTube. Se você precisa de inspiração, marcadores de posição ou está arquivando conteúdo, esta ferramenta fornece as imagens de que você precisa sem complicações.",
    aboutP3:
      'Basta colar o URL do vídeo do YouTube na caixa de entrada, clicar em "Obter Miniaturas" e escolher a resolução que melhor se adapta às suas necessidades. Você pode facilmente baixar a imagem ou copiar seu URL.',
    aboutP4: "Nosso objetivo é manter esta ferramenta rápida, confiável e fácil de usar. Esperamos que você a ache útil!",
    aboutP5Strong: "Observação:",
    aboutP5Text:
      "As miniaturas são propriedade de seus respectivos donos. Por favor, use esta ferramenta com responsabilidade e respeite os regulamentos de direitos autorais e os Termos de Serviço do YouTube.",
    privacyTitle: "Política de Privacidade",
    privacyP1: "Sua privacidade é importante para nós. Esta Política de Privacidade explica como esta ferramenta lida com as informações.",
    privacyHInfo: "Informações que Lidamos:",
    privacyInfo1Strong: "URLs do YouTube:",
    privacyInfo1Text:
      "Processamos os URLs do YouTube que você insere exclusivamente para buscar as miniaturas de vídeo correspondentes nos servidores de imagem publicamente disponíveis do YouTube (img.youtube.com). Não armazenamos esses URLs após processar sua solicitação.",
    privacyInfo2Strong: "Dados de Uso:",
    privacyInfo2Text:
      "Não coletamos informações de identificação pessoal. Podemos usar análises básicas e anônimas (como visualizações de página ou uso de recursos, se implementadas) para entender o uso e melhorar o serviço, mas isso não está vinculado a indivíduos.",
    privacyInfo3Strong: "Cookies/Armazenamento Local:",
    privacyInfo3Text:
      "Usamos `localStorage` apenas para lembrar sua preferência de idioma e modo claro/escuro. Nenhum outro cookie de rastreamento é usado.",
    privacyHUse: "Como Usamos as Informações:",
    privacyUse1: "Para fornecer a funcionalidade principal do downloader de miniaturas.",
    privacyUse2: "Para melhorar a experiência do usuário (ex: lembrar modo escuro, idioma).",
    privacyHShare: "Compartilhamento de Informações:",
    privacyShareText: "Não vendemos ou compartilhamos nenhuma informação fornecida pelo usuário ou dados identificáveis com terceiros.",
    privacyHSecurity: "Segurança:",
    privacySecurityText: "As imagens das miniaturas são buscadas diretamente dos servidores seguros (HTTPS) do YouTube.",
    privacyHChanges: "Alterações a esta Política:",
    privacyChangesText: "Podemos atualizar esta Política de Privacidade ocasionalmente. Encorajamos você a revisá-la periodicamente.",
    termsTitle: "Termos de Serviço",
    termsP1:
      "Bem-vindo! Ao usar nosso site e serviços, você concorda em cumprir e estar vinculado aos seguintes termos e condições.",
    termsH1: "1. Uso do Serviço:",
    terms1a:
      "Esta ferramenta fornece uma maneira de acessar e visualizar imagens de miniaturas publicamente disponíveis associadas a vídeos do YouTube.",
    terms1b:
      "Este serviço destina-se a uso pessoal e não comercial, como visualização, referência ou criação de backups para conteúdo que você possui ou tem direitos de uso (uso justo).",
    terms1c:
      "Você concorda em não usar este serviço para qualquer finalidade ilegal, incluindo violação de direitos autorais, ou de qualquer forma que viole os Termos de Serviço do YouTube.",
    termsH2: "2. Propriedade Intelectual:",
    terms2a: "As imagens das miniaturas recuperadas pertencem ao YouTube ou aos respectivos criadores de conteúdo.",
    terms2b:
      "Esta ferramenta não concede a você quaisquer direitos sobre essas imagens. Você é o único responsável por garantir que possui as permissões necessárias para qualquer uso além do uso justo ou visualização pessoal.",
    termsH3: "3. Isenção de Garantias:",
    terms3a:
      'Esta ferramenta é fornecida "como está", sem quaisquer garantias. Não garantimos a disponibilidade, precisão ou confiabilidade do serviço ou que todas as resoluções de miniaturas existirão para cada vídeo.',
    terms3b: "Não somos afiliados ao YouTube ou Google LLC.",
    termsH4: "4. Limitação de Responsabilidade:",
    terms4Text:
      "Esta ferramenta não será responsável por quaisquer danos resultantes do uso ou da incapacidade de usar este serviço.",
    termsH5: "5. Alterações nos Termos:",
    terms5Text: "Reservamo-nos o direito de modificar estes termos a qualquer momento.",
    feedbackCopied: "URL da imagem copiado!",
    feedbackCopyFail: "Falha ao copiar URL.",
    feedbackInvalidUrl: "Formato de URL do YouTube inválido. Cole o URL completo do vídeo.",
    feedbackNoUrl: "Por favor, cole primeiro um URL do YouTube.",
    feedbackLoadError: "Não foi possível carregar nenhuma miniatura. O vídeo pode ser privado ou excluído.",
    feedbackUnexpectedError: "Ocorreu um erro inesperado.",
    resMaxHd: "Max HD (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // --- Russian ---
  ru: {
    siteTitle: "Загрузчик превью YouTube",
    modeLabel: "Режим",
    mainHeadline: "Загрузчик превью YouTube",
    introParagraph:
      "Быстро скачайте превью любого видео YouTube в потрясающем высоком разрешении (HD), стандартном разрешении (SD) и других доступных размерах. Просто вставьте ссылку на видео ниже и нажмите «Получить превью» – это так просто!",
    urlPlaceholder: "Вставьте URL видео YouTube (например, https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "Получить превью",
    resultsTitle: "Доступные превью",
    downloadBtn: "Скачать",
    copyUrlBtn: "Копировать URL",
    howToTitle: "Как использовать этот инструмент",
    step1: "Найдите видео на YouTube, превью которого вы хотите скачать.",
    step2:
      "Скопируйте полный URL (веб-адрес) видео из адресной строки браузера или опций «Поделиться» в приложении YouTube.",
    step3: "Вставьте скопированный URL в поле ввода выше на этой странице.",
    step4: 'Нажмите кнопку "',
    step4cont: '".',
    step5: "Инструмент мгновенно отобразит все доступные разрешения превью для этого видео.",
    step6: "Выберите желаемый размер превью и способ загрузки:",
    step6a: 'Нажмите кнопку "',
    step6acont: '", чтобы сохранить изображение прямо на ваше устройство.',
    step6b: 'Нажмите кнопку "',
    step6bcont: '", чтобы скопировать ссылку на изображение для встраивания на веб-сайты, в документы или для публикации в социальных сетях.',
    step7:
      'Для наилучших результатов выберите самое высокое доступное разрешение (обычно "Max HD"), если только вам не нужен определенный размер для вашего проекта.',
    howToTip:
      "<strong>Совет:</strong> Вы также можете использовать этот инструмент на мобильных устройствах! Просто поделитесь ссылкой на видео YouTube из приложения YouTube в свой браузер, а затем вставьте ее здесь.",
    whyTitle: "Почему стоит использовать наш загрузчик?",
    whyIntro: "Наш загрузчик превью YouTube выделяется среди других инструментов благодаря этим ключевым преимуществам:",
    why1strong: "Быстро и легко",
    why1text: "Получайте превью за секунды простым действием копирования и вставки. Никаких сложных шагов не требуется.",
    why2strong: "Высокое качество",
    why2text: "Скачивайте превью в самых высоких доступных разрешениях, включая HD (1280x720), когда это возможно.",
    why3strong: "Несколько разрешений",
    why3text: "Мы предоставляем опции для различных размеров (HD, SD, HQ, MQ), чтобы вы могли выбрать идеальный вариант.",
    why4strong: "Полностью бесплатно",
    why4text: "Это бесплатный инструмент для всех. Никаких скрытых платежей или регистрации для скачивания превью YouTube.",
    why5strong: "Без установки ПО",
    why5text: "Работает прямо в вашем веб-браузере на любом устройстве (компьютер, планшет, мобильный телефон).",
    why6strong: "Чисто и безопасно",
    why6text:
      "Мы отдаем приоритет простому опыту и получаем изображения напрямую с безопасных серверов YouTube (img.youtube.com).",
    whyConclusion:
      "Этот захватчик превью YouTube идеально подходит для создателей контента, менеджеров социальных сетей, дизайнеров и всех, кому нужен быстрый доступ к превью видео.",
    whyUseCasesTitle: "Популярные сценарии использования:",
    useCase1: "Создание превью видео для вашего собственного контента",
    useCase2: "Исследование тенденций дизайна превью",
    useCase3: "Сохранение превью для образовательных презентаций",
    useCase4: "Создание библиотек контента и досок настроения",
    useCase5: "Анализ превью конкурентов для маркетинговых исследований",
    faqTitle: "Часто задаваемые вопросы (FAQ)",
    faqQ1: "Как скачать превью YouTube?",
    faqA1:
      'Просто вставьте полный URL видео YouTube в поле ввода на этой странице и нажмите "Получить превью". Мы покажем вам все доступные размеры (HD, SD и т. д.), и вы сможете нажать кнопку "Скачать" для нужного вам. Изображение будет сохранено в папку загрузок по умолчанию на вашем устройстве.',
    faqQ2: "Какие разрешения превью я могу скачать?",
    faqA2:
      "Мы пытаемся получить несколько стандартных разрешений превью YouTube: Максимальное высокое разрешение (Maxres/1280x720, если доступно), Стандартное разрешение (SD/640x480), Высокое качество (HQ/480x360) и Среднее качество (MQ/320x180). Самое высокое качество (Maxres HD) не всегда генерируется YouTube для каждого видео, особенно для старого или менее популярного контента.",
    faqQ3: "Использование этого загрузчика превью YouTube бесплатно?",
    faqA3:
      "Да, этот инструмент полностью бесплатен. Вы можете скачивать столько превью, сколько вам нужно, без какой-либо платы или регистрации. Мы не требуем создания учетной записи, адресов электронной почты или какой-либо личной информации.",
    faqQ4: "Могу ли я скачать превью для частных видео?",
    faqA4:
      "Нет, этот инструмент может получать превью только для общедоступных видео YouTube. Превью для частных или не включенных в список видео, требующих входа в систему, недоступны. Это ограничение платформы YouTube, а не нашего инструмента.",
    faqQ5: "Есть ли какие-либо ограничения авторских прав на скачанные превью?",
    faqA5:
      "Да. Превью YouTube обычно защищены авторским правом либо YouTube, либо создателем видео. Вы должны использовать скачанные превью только способами, которые уважают законы об авторском праве и Условия использования YouTube. Использование их для вашего собственного контента без разрешения может представлять собой нарушение. Этот инструмент предоставляется для удобства (например, предварительный просмотр, личное резервное копирование, контексты добросовестного использования), но вы несете ответственность за то, как вы используете изображения.",
    faqQ6: "Почему иногда отсутствует превью HD (1280x720)?",
    faqA6:
      "YouTube не генерирует автоматически превью `maxresdefault.jpg` (HD 1280x720) для каждого видео. Оно чаще встречается на популярных или недавно загруженных видео. Если оно недоступно, `sddefault.jpg` (640x480) обычно является следующим лучшим качеством.",
    faqQ7: "Могу ли я использовать этот инструмент на своем мобильном устройстве?",
    faqA7:
      "Наш инструмент работает на любом устройстве с веб-браузером, включая смартфоны и планшеты. Адаптивный дизайн обеспечивает плавный опыт независимо от размера экрана.",
    faqQ8: "Как я могу использовать скачанные превью?",
    faqA8:
       "Скачанные превью можно использовать для различных целей, таких как создание плейлистов видео, постов в блогах, презентаций, исследований или личных коллекций. Помните об уважении авторских прав при использовании превью в общественных или коммерческих целях.",
    faqQ9: "Работает ли этот инструмент с YouTube Shorts?",
    faqA9:
      "Да, наш инструмент также работает с YouTube Shorts. Просто вставьте URL YouTube Short, и мы извлечем доступные превью так же, как и для обычных видео YouTube.",
    footerAbout: "О нас",
    footerPrivacy: "Политика конфиденциальности",
    footerTerms: "Условия использования",
    footerFaq: "FAQ",
    siteTitleFooter: "Загрузчик превью YouTube",
    footerRights: "Все права защищены.",
    footerDisclaimer:
      "Отказ от ответственности: Скачанные превью подпадают под действие авторских прав YouTube и создателя. Используйте ответственно.",
    aboutTitle: "Об этом инструменте",
    aboutP1: "Добро пожаловать! Это ваш простой и эффективный инструмент для скачивания превью видео YouTube.",
    aboutP2:
      "Мы создали этот инструмент, чтобы предоставить быстрый и простой способ для создателей контента, маркетологов и всех заинтересованных лиц получать высококачественные превью из видео YouTube. Нужны ли вам вдохновение, заполнители или вы архивируете контент, этот инструмент предоставит вам нужные изображения без хлопот.",
    aboutP3:
      'Просто вставьте URL видео YouTube в поле ввода, нажмите "Получить превью" и выберите разрешение, которое наилучшим образом соответствует вашим потребностям. Вы можете легко скачать изображение или скопировать его URL.',
    aboutP4: "Наша цель - поддерживать этот инструмент быстрым, надежным и удобным для пользователя. Надеемся, он вам пригодится!",
    aboutP5Strong: "Пожалуйста, обратите внимание:",
    aboutP5Text:
      "Превью являются собственностью их соответствующих владельцев. Пожалуйста, используйте этот инструмент ответственно и уважайте правила авторского права и Условия использования YouTube.",
    privacyTitle: "Политика конфиденциальности",
    privacyP1: "Ваша конфиденциальность важна для нас. Эта Политика конфиденциальности объясняет, как этот инструмент обрабатывает информацию.",
    privacyHInfo: "Информация, которую мы обрабатываем:",
    privacyInfo1Strong: "URL-адреса YouTube:",
    privacyInfo1Text:
      "Мы обрабатываем URL-адреса YouTube, которые вы вводите, исключительно для получения соответствующих превью видео с общедоступных серверов изображений YouTube (img.youtube.com). Мы не храним эти URL-адреса после обработки вашего запроса.",
    privacyInfo2Strong: "Данные об использовании:",
    privacyInfo2Text:
      "Мы не собираем личную идентификационную информацию. Мы можем использовать базовую анонимную аналитику (например, просмотры страниц или использование функций, если реализовано) для понимания использования и улучшения сервиса, но это не связано с отдельными лицами.",
    privacyInfo3Strong: "Файлы cookie/Локальное хранилище:",
    privacyInfo3Text:
      "Мы используем `localStorage` только для запоминания ваших предпочтений языка и светлого/темного режима. Другие отслеживающие файлы cookie не используются.",
    privacyHUse: "Как мы используем информацию:",
    privacyUse1: "Для предоставления основной функциональности загрузчика превью.",
    privacyUse2: "Для улучшения пользовательского опыта (например, запоминание темного режима, языка).",
    privacyHShare: "Обмен информацией:",
    privacyShareText: "Мы не продаем и не передаем никакую предоставленную пользователем информацию или идентифицируемые данные третьим лицам.",
    privacyHSecurity: "Безопасность:",
    privacySecurityText: "Изображения превью получаются напрямую с безопасных (HTTPS) серверов YouTube.",
    privacyHChanges: "Изменения в этой Политике:",
    privacyChangesText: "Мы можем время от времени обновлять эту Политику конфиденциальности. Мы рекомендуем вам периодически просматривать ее.",
    termsTitle: "Условия использования",
    termsP1:
      "Добро пожаловать! Используя наш веб-сайт и услуги, вы соглашаетесь соблюдать следующие условия и положения и быть связанными ими.",
    termsH1: "1. Использование Сервиса:",
    terms1a:
      "Этот инструмент предоставляет способ доступа и просмотра общедоступных изображений превью, связанных с видео YouTube.",
    terms1b:
      "Этот сервис предназначен для личного, некоммерческого использования, такого как предварительный просмотр, ссылка или создание резервных копий для контента, которым вы владеете или имеете права на использование (добросовестное использование).",
    terms1c:
      "Вы соглашаетесь не использовать этот сервис для каких-либо незаконных целей, включая нарушение авторских прав, или любым способом, нарушающим Условия использования YouTube.",
    termsH2: "2. Интеллектуальная собственность:",
    terms2a: "Полученные изображения превью принадлежат YouTube или соответствующим создателям контента.",
    terms2b:
      "Этот инструмент не предоставляет вам никаких прав на эти изображения. Вы несете единоличную ответственность за обеспечение наличия необходимых разрешений для любого использования, выходящего за рамки добросовестного использования или личного просмотра.",
    termsH3: "3. Отказ от гарантий:",
    terms3a:
      'Этот инструмент предоставляется "как есть" без каких-либо гарантий. Мы не гарантируем доступность, точность или надежность сервиса, а также то, что все разрешения превью будут существовать для каждого видео.',
    terms3b: "Мы не связаны с YouTube или Google LLC.",
    termsH4: "4. Ограничение ответственности:",
    terms4Text:
      "Этот инструмент не несет ответственности за любые убытки, возникшие в результате использования или невозможности использования этого сервиса.",
    termsH5: "5. Изменения Условий:",
    terms5Text: "Мы оставляем за собой право изменять эти условия в любое время.",
    feedbackCopied: "URL изображения скопирован!",
    feedbackCopyFail: "Не удалось скопировать URL.",
    feedbackInvalidUrl: "Неверный формат URL YouTube. Пожалуйста, вставьте полный URL видео.",
    feedbackNoUrl: "Пожалуйста, сначала вставьте URL YouTube.",
    feedbackLoadError: "Не удалось загрузить превью. Видео может быть частным или удалено.",
    feedbackUnexpectedError: "Произошла непредвиденная ошибка.",
    resMaxHd: "Макс HD (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // --- Japanese ---
  ja: {
    siteTitle: "YouTubeサムネイルダウンローダー",
    modeLabel: "モード",
    mainHeadline: "YouTubeサムネイルダウンローダー",
    introParagraph:
      "YouTube動画のサムネイルを高画質(HD)、標準画質(SD)、その他の利用可能なサイズで素早くダウンロードできます。下のボックスに動画のリンクを貼り付けて「サムネイルを取得」をクリックするだけ – 簡単です！",
    urlPlaceholder: "YouTube動画のURLを貼り付け (例: https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "サムネイルを取得",
    resultsTitle: "利用可能なサムネイル",
    downloadBtn: "ダウンロード",
    copyUrlBtn: "URLをコピー",
    howToTitle: "このツールの使い方",
    step1: "ダウンロードしたいサムネイルのYouTube動画を見つけます。",
    step2:
      "ブラウザのアドレスバーまたはYouTubeアプリの共有オプションから、動画の完全なURL（ウェブアドレス）をコピーします。",
    step3: "コピーしたURLを、このページの上部にある入力ボックスに貼り付けます。",
    step4: '「',
    step4cont: '」ボタンをクリックします。',
    step5: "ツールが即座にその動画で利用可能なすべてのサムネイル解像度を表示します。",
    step6: "希望するサムネイルサイズとダウンロード方法を選択します:",
    step6a: '「',
    step6acont: '」ボタンをクリックして、画像を直接デバイスに保存します。',
    step6b: '「',
    step6bcont:
      '」ボタンをクリックして、ウェブサイト、ドキュメントへの埋め込み、またはソーシャルメディアでの共有のために画像リンクをコピーします。',
    step7:
      'プロジェクトに特定のサイズが必要でない限り、利用可能な最高の解像度（通常は「Max HD」）を選択するのが最良の結果を得る方法です。',
    howToTip:
      "<strong>プロのヒント:</strong> このツールはモバイルデバイスでも使用できます！ YouTubeアプリからYouTube動画リンクをブラウザに共有し、ここに貼り付けるだけです。",
    whyTitle: "なぜ私たちのダウンローダーを使うのか？",
    whyIntro: "私たちのYouTubeサムネイルダウンローダーは、これらの主な利点で他のツールより優れています：",
    why1strong: "速くて簡単",
    why1text: "簡単なコピー＆ペースト操作で数秒でサムネイルを取得。複雑な手順は不要です。",
    why2strong: "高画質",
    why2text: "利用可能な最高の解像度でサムネイルをダウンロードします。HD（1280x720）も利用可能な場合は含まれます。",
    why3strong: "複数の解像度",
    why3text: "さまざまなサイズ（HD、SD、HQ、MQ）のオプションを提供しているので、最適なものを選べます。",
    why4strong: "完全無料",
    why4text: "これは誰でも無料で使えるツールです。YouTubeサムネイルをダウンロードするための隠れたコストやサインアップは必要ありません。",
    why5strong: "ソフトウェアのインストール不要",
    why5text: "どのデバイス（デスクトップ、タブレット、モバイル）のウェブブラウザでも直接動作します。",
    why6strong: "クリーンで安全",
    why6text:
      "シンプルな体験を優先し、YouTubeの安全なサーバー（img.youtube.com）から直接画像を取得します。",
    whyConclusion:
      "このYouTubeサムネイルグラバーは、コンテンツクリエーター、ソーシャルメディアマネージャー、デザイナー、またはビデオサムネイルへの迅速なアクセスが必要な人に最適です。",
    whyUseCasesTitle: "一般的な使用例：",
    useCase1: "自分のコンテンツ用のビデオサムネイルを作成する",
    useCase2: "サムネイルデザインのトレンドを調査する",
    useCase3: "教育プレゼンテーション用にサムネイルを保存する",
    useCase4: "コンテンツライブラリやムードボードを構築する",
    useCase5: "マーケティング調査のために競合他社のサムネイルを分析する",
    faqTitle: "よくある質問（FAQ）",
    faqQ1: "YouTubeのサムネイルをダウンロードするにはどうすればいいですか？",
    faqA1:
      'このページの入力ボックスにYouTube動画の完全なURLを貼り付け、「サムネイルを取得」をクリックするだけです。利用可能なすべてのサイズ（HD、SDなど）が表示され、希望するものの「ダウンロード」ボタンをクリックできます。画像はデバイスのデフォルトのダウンロード場所に保存されます。',
    faqQ2: "どの解像度のサムネイルをダウンロードできますか？",
    faqA2:
      "いくつかの標準的なYouTubeサムネイル解像度の取得を試みます：最大高解像度（Maxres/1280x720、利用可能な場合）、標準解像度（SD/640x480）、高品質（HQ/480x360）、および中品質（MQ/320x180）。最高品質（Maxres HD）は、特に古いコンテンツや人気のないコンテンツの場合、すべての動画に対してYouTubeによって常に生成されるわけではありません。",
    faqQ3: "このYouTubeサムネイルダウンローダーは無料で使用できますか？",
    faqA3:
      "はい、このツールは完全に無料で使用できます。料金や登録なしで、必要なだけ多くのサムネイルをダウンロードできます。アカウント作成、メールアドレス、または個人情報は必要ありません。",
    faqQ4: "プライベート動画のサムネイルをダウンロードできますか？",
    faqA4:
      "いいえ、このツールは一般公開されているYouTube動画のサムネイルのみを取得できます。ログインが必要なプライベート動画や限定公開動画のサムネイルにはアクセスできません。これはYouTubeプラットフォームの制限であり、私たちのツールの制限ではありません。",
    faqQ5: "ダウンロードしたサムネイルに著作権の制限はありますか？",
    faqA5:
      "はい。YouTubeのサムネイルは通常、YouTubeまたは動画作成者のいずれかによって著作権で保護されています。ダウンロードしたサムネイルは、著作権法およびYouTubeの利用規約を尊重する方法でのみ使用する必要があります。許可なく自分のコンテンツに使用することは侵害にあたる可能性があります。このツールは便宜のために提供されていますが（例：プレビュー、個人的なバックアップ、フェアユースの文脈）、画像の利用方法についてはあなたが責任を負います。",
    faqQ6: "なぜHD（1280x720）のサムネイルがないことがあるのですか？",
    faqA6:
      "YouTubeはすべての動画に対して`maxresdefault.jpg`（HD 1280x720）サムネイルを自動的に生成するわけではありません。人気のある動画や最近アップロードされた動画でより一般的です。利用できない場合、`sddefault.jpg`（640x480）が通常、次に良い品質です。",
    faqQ7: "このツールをモバイルデバイスで使用できますか？",
    faqA7:
      "私たちのツールは、スマートフォンやタブレットを含む、ウェブブラウザを備えたどのデバイスでも動作します。レスポンシブデザインにより、画面サイズに関係なくスムーズな体験が保証されます。",
    faqQ8: "ダウンロードしたサムネイルはどのように使用できますか？",
    faqA8:
       "ダウンロードしたサムネイルは、動画プレイリストの作成、ブログ投稿、プレゼンテーション、調査、個人コレクションなど、さまざまな目的に使用できます。公共または商業目的でサムネイルを使用する場合は、著作権を尊重することを忘れないでください。",
    faqQ9: "このツールはYouTubeショートで動作しますか？",
    faqA9:
      "はい、私たちのツールはYouTubeショートでも動作します。YouTubeショートのURLを貼り付けるだけで、通常のYouTube動画と同じように利用可能なサムネイルを抽出します。",
    footerAbout: "私たちについて",
    footerPrivacy: "プライバシーポリシー",
    footerTerms: "利用規約",
    footerFaq: "FAQ",
    siteTitleFooter: "YouTubeサムネイルダウンローダー",
    footerRights: "All rights reserved.", // Often kept in English
    footerDisclaimer:
      "免責事項：ダウンロードされたサムネイルは、YouTubeおよび作成者の著作権の対象となります。責任を持って使用してください。",
    aboutTitle: "このツールについて",
    aboutP1: "ようこそ！これはYouTube動画のサムネイルをダウンロードするためのシンプルで効率的なツールです。",
    aboutP2:
      "コンテンツ作成者、マーケター、その他関心のある方々がYouTube動画から高品質のサムネイルを素早く簡単に入手できるように、このツールを作成しました。インスピレーションが必要な場合、プレースホルダーが必要な場合、またはコンテンツをアーカイブしている場合でも、このツールを使えば手間なく必要な画像を入手できます。",
    aboutP3:
      '入力ボックスにYouTube動画のURLを貼り付け、「サムネイルを取得」をクリックし、ニーズに最適な解像度を選択するだけです。画像を簡単にダウンロードしたり、そのURLをコピーしたりできます。',
    aboutP4: "私たちの目標は、このツールを高速、信頼性、使いやすさを維持することです。お役に立てれば幸いです！",
    aboutP5Strong: "ご注意ください：",
    aboutP5Text:
      "サムネイルはそれぞれの所有者の財産です。このツールを責任を持って使用し、著作権規制およびYouTubeの利用規約を尊重してください。",
    privacyTitle: "プライバシーポリシー",
    privacyP1: "お客様のプライバシーは私たちにとって重要です。このプライバシーポリシーは、このツールが情報をどのように扱うかを説明します。",
    privacyHInfo: "私たちが扱う情報：",
    privacyInfo1Strong: "YouTube URL：",
    privacyInfo1Text:
      "お客様が入力したYouTube URLは、YouTubeの一般公開されている画像サーバー（img.youtube.com）から対応する動画サムネイルを取得するためだけに使用されます。リクエスト処理後、これらのURLは保存しません。",
    privacyInfo2Strong: "使用状況データ：",
    privacyInfo2Text:
      "個人を特定できる情報は収集しません。使用状況を理解しサービスを改善するために、基本的な匿名分析（ページビューや機能の使用状況など、実装されている場合）を使用することがありますが、これは個人とはリンクされていません。",
    privacyInfo3Strong: "Cookie/ローカルストレージ：",
    privacyInfo3Text:
      "言語とライト/ダークモードの設定を記憶するためだけに`localStorage`を使用します。他の追跡Cookieは使用されません。",
    privacyHUse: "情報の使用方法：",
    privacyUse1: "サムネイルダウンローダーのコア機能を提供するため。",
    privacyUse2: "ユーザーエクスペリエンスを向上させるため（例：ダークモード、言語の記憶）。",
    privacyHShare: "情報の共有：",
    privacyShareText: "ユーザー提供の情報や識別可能なデータを第三者と販売または共有することはありません。",
    privacyHSecurity: "セキュリティ：",
    privacySecurityText: "サムネイル画像は、YouTubeの安全な（HTTPS）サーバーから直接取得されます。",
    privacyHChanges: "このポリシーの変更：",
    privacyChangesText: "このプライバシーポリシーは随時更新されることがあります。定期的に確認することをお勧めします。",
    termsTitle: "利用規約",
    termsP1:
      "ようこそ！当社のウェブサイトおよびサービスを利用することにより、以下の利用規約に従い、それに拘束されることに同意するものとします。",
    termsH1: "1. サービスの利用：",
    terms1a:
      "このツールは、YouTube動画に関連付けられた一般公開されているサムネイル画像にアクセスし表示する方法を提供します。",
    terms1b:
      "このサービスは、個人的、非商業的な使用（例：プレビュー、参照、所有または使用権のあるコンテンツのバックアップ作成（フェアユース））を目的としています。",
    terms1c:
      "著作権侵害を含むいかなる違法な目的のため、またはYouTubeの利用規約に違反する方法でこのサービスを使用しないことに同意するものとします。",
    termsH2: "2. 知的財産：",
    terms2a: "取得されたサムネイル画像は、YouTubeまたはそれぞれのコンテンツ作成者に帰属します。",
    terms2b:
      "このツールは、これらの画像に関するいかなる権利もお客様に付与しません。フェアユースまたは個人的な閲覧を超える使用に必要な許可を確実に得ることについて、お客様が単独で責任を負います。",
    termsH3: "3. 保証の否認：",
    terms3a:
      'このツールは、いかなる保証もなく「現状有姿」で提供されます。サービスの利用可能性、正確性、信頼性、またはすべての動画に対してすべてのサムネイル解像度が存在することを保証しません。',
    terms3b: "当社はYouTubeまたはGoogle LLCとは提携していません。",
    termsH4: "4. 責任の制限：",
    terms4Text:
      "このツールは、本サービスの利用または利用不能から生じるいかなる損害についても責任を負わないものとします。",
    termsH5: "5. 規約の変更：",
    terms5Text: "当社は、いつでもこれらの規約を変更する権利を留保します。",
    feedbackCopied: "画像URLをコピーしました！",
    feedbackCopyFail: "URLのコピーに失敗しました。",
    feedbackInvalidUrl: "無効なYouTube URL形式です。完全な動画URLを貼り付けてください。",
    feedbackNoUrl: "最初にYouTube URLを貼り付けてください。",
    feedbackLoadError: "サムネイルを読み込めませんでした。動画がプライベートまたは削除されている可能性があります。",
    feedbackUnexpectedError: "予期しないエラーが発生しました。",
    resMaxHd: "最大HD (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // --- Chinese (Simplified) ---
  zh: {
    siteTitle: "YouTube 缩略图下载器",
    modeLabel: "模式",
    mainHeadline: "YouTube 缩略图下载器",
    introParagraph:
      "快速下载任何 YouTube 视频的高清 (HD)、标清 (SD) 和其他可用尺寸的缩略图。只需将视频链接粘贴到下方，然后点击“获取缩略图”即可——就是这么简单！",
    urlPlaceholder: "粘贴 YouTube 视频 URL (例如 https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "获取缩略图",
    resultsTitle: "可用缩略图",
    downloadBtn: "下载",
    copyUrlBtn: "复制 URL",
    howToTitle: "如何使用此工具",
    step1: "找到您想下载缩略图的 YouTube 视频。",
    step2:
      "从浏览器的地址栏或 YouTube 应用的分享选项中复制视频的完整 URL（网址）。",
    step3: "将复制的 URL 粘贴到此页面上方的输入框中。",
    step4: '点击“',
    step4cont: '”按钮。',
    step5: "该工具将立即显示该视频所有可用的缩略图分辨率。",
    step6: "选择所需的缩略图尺寸和下载方法：",
    step6a: '点击“',
    step6acont: '”按钮将图像直接保存到您的设备。',
    step6b: '点击“',
    step6bcont: '”按钮复制图像链接，以便嵌入网站、文档或在社交媒体上分享。',
    step7:
      '为获得最佳效果，请选择可用的最高分辨率（通常是“Max HD”），除非您的项目需要特定尺寸。',
    howToTip:
      "<strong>专业提示：</strong> 您也可以在移动设备上使用此工具！只需将 YouTube 应用中的 YouTube 视频链接分享到您的浏览器，然后在此处粘贴即可。",
    whyTitle: "为何使用我们的下载器？",
    whyIntro: "我们的 YouTube 缩略图下载器凭借以下关键优势脱颖而出：",
    why1strong: "快速简便",
    why1text: "通过简单的复制粘贴操作，在几秒钟内获取缩略图。无需复杂步骤。",
    why2strong: "高品质",
    why2text: "下载可用最高分辨率的缩略图，包括可用时的 HD (1280x720)。",
    why3strong: "多种分辨率",
    why3text: "我们提供各种尺寸（HD、SD、HQ、MQ）的选项，以便您选择最合适的。",
    why4strong: "完全免费",
    why4text: "这是一个面向所有人的免费工具。下载 YouTube 缩略图无需隐藏费用或注册。",
    why5strong: "无需安装软件",
    why5text: "直接在任何设备（台式机、平板电脑、移动设备）的网络浏览器中工作。",
    why6strong: "干净安全",
    why6text:
      "我们优先考虑简单的体验，并直接从 YouTube 的安全服务器 (img.youtube.com) 获取图像。",
    whyConclusion:
      "这款 YouTube 缩略图抓取器非常适合内容创作者、社交媒体经理、设计师或任何需要快速访问视频缩略图的人。",
    whyUseCasesTitle: "热门用例：",
    useCase1: "为自己的内容创建视频缩略图",
    useCase2: "研究缩略图设计趋势",
    useCase3: "为教育演示文稿保存缩略图",
    useCase4: "构建内容库和情绪板",
    useCase5: "分析竞争对手的缩略图以进行市场研究",
    faqTitle: "常见问题解答 (FAQ)",
    faqQ1: "如何下载 YouTube 缩略图？",
    faqA1:
      '只需将完整的 YouTube 视频 URL 粘贴到此页面的输入框中，然后点击“获取缩略图”。我们将向您显示所有可用尺寸（HD、SD 等），您可以点击所需尺寸的“下载”按钮。图像将保存到您设备的默认下载位置。',
    faqQ2: "我可以下载哪些分辨率的缩略图？",
    faqA2:
      "我们尝试获取几种标准的 YouTube 缩略图分辨率：最高高清 (Maxres/1280x720，如果可用)、标清 (SD/640x480)、高质量 (HQ/480x360) 和中等质量 (MQ/320x180)。最高质量 (Maxres HD) 并非 YouTube 为每个视频都生成，尤其是对于较旧或不太受欢迎的内容。",
    faqQ3: "使用此 YouTube 缩略图下载器是免费的吗？",
    faqA3:
      "是的，此工具完全免费使用。您可以根据需要下载任意数量的缩略图，无需任何费用或注册。我们不需要创建帐户、电子邮件地址或任何个人信息。",
    faqQ4: "我可以下载私人视频的缩略图吗？",
    faqA4:
      "不可以，此工具只能获取公开访问的 YouTube 视频的缩略图。无法访问需要登录的私人或不公开列出的视频的缩略图。这是 YouTube 平台的限制，而非我们工具的限制。",
    faqQ5: "下载的缩略图是否有任何版权限制？",
    faqA5:
      "是的。YouTube 缩略图通常受 YouTube 或视频创作者的版权保护。您只能以尊重版权法和 YouTube 服务条款的方式使用下载的缩略图。未经许可将其用于您自己的内容可能构成侵权。提供此工具是为了方便（例如，预览、个人备份、合理使用情况），但您对如何使用图像负责。",
    faqQ6: "为什么有时会缺少 HD (1280x720) 缩略图？",
    faqA6:
      "YouTube 不会自动为每个视频生成 `maxresdefault.jpg` (HD 1280x720) 缩略图。它在热门或最近上传的视频中更常见。如果它不可用，`sddefault.jpg` (640x480) 通常是次佳质量。",
    faqQ7: "我可以在我的移动设备上使用此工具吗？",
    faqA7:
      "我们的工具可在任何带有网络浏览器的设备上运行，包括智能手机和平板电脑。响应式设计确保无论屏幕大小如何，都能获得流畅的体验。",
    faqQ8: "我该如何使用下载的缩略图？",
    faqA8:
       "下载的缩略图可用于各种目的，例如创建视频播放列表、博客文章、演示文稿、研究或个人收藏。在将缩略图用于公共或商业目的时，请记住尊重版权。",
    faqQ9: "此工具适用于 YouTube Shorts 吗？",
    faqA9:
      "是的，我们的工具也适用于 YouTube Shorts。只需粘贴 YouTube Shorts URL，我们将像处理常规 YouTube 视频一样提取可用的缩略图。",
    footerAbout: "关于我们",
    footerPrivacy: "隐私政策",
    footerTerms: "服务条款",
    footerFaq: "FAQ",
    siteTitleFooter: "YouTube 缩略图下载器",
    footerRights: "版权所有。",
    footerDisclaimer:
      "免责声明：下载的缩略图受 YouTube 和创作者的版权约束。请负责任地使用。",
    aboutTitle: "关于此工具",
    aboutP1: "欢迎！这是您下载 YouTube 视频缩略图的简单高效工具。",
    aboutP2:
      "我们创建此工具是为了让内容创作者、营销人员以及任何感兴趣的人能够快速轻松地从 YouTube 视频中获取高质量的缩略图。无论您是需要灵感、占位符，还是在存档内容，此工具都能让您轻松获得所需的图像。",
    aboutP3:
      '只需将 YouTube 视频 URL 粘贴到输入框中，点击“获取缩略图”，然后选择最适合您需求的的分辨率。您可以轻松下载图像或复制其 URL。',
    aboutP4: "我们的目标是保持此工具快速、可靠且用户友好。希望您觉得它有用！",
    aboutP5Strong: "请注意：",
    aboutP5Text:
      "缩略图是其各自所有者的财产。请负责任地使用此工具，并遵守版权法规和 YouTube 的服务条款。",
    privacyTitle: "隐私政策",
    privacyP1: "您的隐私对我们很重要。本隐私政策解释了此工具如何处理信息。",
    privacyHInfo: "我们处理的信息：",
    privacyInfo1Strong: "YouTube URL：",
    privacyInfo1Text:
      "我们处理您输入的 YouTube URL，仅用于从 YouTube 的公开可用图像服务器 (img.youtube.com) 获取相应的视频缩略图。在处理完您的请求后，我们不会存储这些 URL。",
    privacyInfo2Strong: "使用数据：",
    privacyInfo2Text:
      "我们不收集个人身份信息。我们可能会使用基本的匿名分析（例如页面浏览量或功能使用情况，如果已实施）来了解使用情况并改进服务，但这与个人无关。",
    privacyInfo3Strong: "Cookie/本地存储：",
    privacyInfo3Text:
      "我们仅使用 `localStorage` 来记住您的语言和浅色/深色模式偏好。不使用其他跟踪 cookie。",
    privacyHUse: "我们如何使用信息：",
    privacyUse1: "提供缩略图下载器的核心功能。",
    privacyUse2: "改善用户体验（例如，记住深色模式、语言）。",
    privacyHShare: "信息共享：",
    privacyShareText: "我们不会向第三方出售或共享任何用户提供的信息或可识别数据。",
    privacyHSecurity: "安全：",
    privacySecurityText: "缩略图图像直接从 YouTube 的安全 (HTTPS) 服务器获取。",
    privacyHChanges: "本政策的变更：",
    privacyChangesText: "我们可能会偶尔更新本隐私政策。我们鼓励您定期查看。",
    termsTitle: "服务条款",
    termsP1:
      "欢迎！使用我们的网站和服务，即表示您同意遵守并受以下条款和条件的约束。",
    termsH1: "1. 服务使用：",
    terms1a:
      "此工具提供了一种访问和查看与 YouTube 视频关联的公开可用缩略图图像的方法。",
    terms1b:
      "此服务旨在用于个人、非商业用途，例如预览、参考或为您拥有或有权使用的内容创建备份（合理使用）。",
    terms1c:
      "您同意不将此服务用于任何非法目的，包括侵犯版权，或以任何违反 YouTube 服务条款的方式使用。",
    termsH2: "2. 知识产权：",
    terms2a: "检索到的缩略图图像属于 YouTube 或各自的内容创作者。",
    terms2b:
      "此工具不授予您对这些图像的任何权利。您全权负责确保您拥有超出合理使用或个人查看范围的任何使用所需的必要权限。",
    termsH3: "3. 免责声明：",
    terms3a:
      '此工具按“原样”提供，不提供任何保证。我们不保证服务的可用性、准确性或可靠性，也不保证每个视频都存在所有缩略图分辨率。',
    terms3b: "我们与 YouTube 或 Google LLC 无关。",
    termsH4: "4. 责任限制：",
    terms4Text:
      "对于因使用或无法使用此服务而导致的任何损害，本工具概不负责。",
    termsH5: "5. 条款变更：",
    terms5Text: "我们保留随时修改这些条款的权利。",
    feedbackCopied: "图片 URL 已复制！",
    feedbackCopyFail: "复制 URL 失败。",
    feedbackInvalidUrl: "YouTube URL 格式无效。请粘贴完整的视频 URL。",
    feedbackNoUrl: "请先粘贴 YouTube URL。",
    feedbackLoadError: "无法加载任何缩略图。视频可能是私人的或已被删除。",
    feedbackUnexpectedError: "发生意外错误。",
    resMaxHd: "最大 HD (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // --- Korean ---
  ko: {
    siteTitle: "YouTube 썸네일 다운로더",
    modeLabel: "모드",
    mainHeadline: "YouTube 썸네일 다운로더",
    introParagraph:
      "모든 YouTube 동영상의 썸네일을 고화질(HD), 표준화질(SD) 및 기타 사용 가능한 크기로 빠르게 다운로드하세요. 아래에 비디오 링크를 붙여넣고 '썸네일 가져오기'를 클릭하기만 하면 됩니다 – 간단합니다!",
    urlPlaceholder: "YouTube 동영상 URL 붙여넣기 (예: https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "썸네일 가져오기",
    resultsTitle: "사용 가능한 썸네일",
    downloadBtn: "다운로드",
    copyUrlBtn: "URL 복사",
    howToTitle: "이 도구 사용 방법",
    step1: "썸네일을 다운로드하려는 YouTube 동영상을 찾습니다.",
    step2:
      "브라우저 주소 표시줄이나 YouTube 앱 공유 옵션에서 동영상의 전체 URL(웹 주소)을 복사합니다.",
    step3: "복사한 URL을 이 페이지 위의 입력란에 붙여넣습니다.",
    step4: ' "',
    step4cont: '" 버튼을 클릭합니다.',
    step5: "도구가 즉시 해당 동영상에 사용 가능한 모든 썸네일 해상도를 표시합니다.",
    step6: "원하는 썸네일 크기와 다운로드 방법을 선택합니다:",
    step6a: ' "',
    step6acont: '" 버튼을 클릭하여 이미지를 기기에 직접 저장합니다.',
    step6b: ' "',
    step6bcont: '" 버튼을 클릭하여 웹사이트, 문서에 삽입하거나 소셜 미디어에 공유할 이미지 링크를 복사합니다.',
    step7:
      '프로젝트에 특정 크기가 필요하지 않다면 사용 가능한 가장 높은 해상도(보통 "Max HD")를 선택하는 것이 가장 좋습니다.',
    howToTip:
      "<strong>프로 팁:</strong> 모바일 기기에서도 이 도구를 사용할 수 있습니다! YouTube 앱에서 YouTube 동영상 링크를 브라우저로 공유한 다음 여기에 붙여넣기만 하면 됩니다.",
    whyTitle: "왜 우리 다운로더를 사용해야 할까요?",
    whyIntro: "우리 YouTube 썸네일 다운로더는 다음과 같은 주요 이점으로 다른 도구와 차별화됩니다:",
    why1strong: "빠르고 쉬움",
    why1text: "간단한 복사-붙여넣기 작업으로 몇 초 만에 썸네일을 얻을 수 있습니다. 복잡한 단계가 필요 없습니다.",
    why2strong: "고품질",
    why2text: "사용 가능한 가장 높은 해상도로 썸네일을 다운로드하세요. 가능한 경우 HD(1280x720) 포함.",
    why3strong: "다중 해상도",
    why3text: "다양한 크기(HD, SD, HQ, MQ) 옵션을 제공하여 완벽한 크기를 선택할 수 있습니다.",
    why4strong: "완전 무료",
    why4text: "모든 사람을 위한 무료 도구입니다. YouTube 썸네일을 다운로드하는 데 숨겨진 비용이나 가입이 필요하지 않습니다.",
    why5strong: "소프트웨어 설치 불필요",
    why5text: "모든 기기(데스크톱, 태블릿, 모바일)의 웹 브라우저에서 직접 작동합니다.",
    why6strong: "깨끗하고 안전함",
    why6text:
      "간단한 경험을 우선시하며 YouTube의 보안 서버(img.youtube.com)에서 직접 이미지를 가져옵니다.",
    whyConclusion:
      "이 YouTube 썸네일 그래버는 콘텐츠 제작자, 소셜 미디어 관리자, 디자이너 또는 비디오 썸네일에 빠르게 액세스해야 하는 모든 사람에게 이상적입니다.",
    whyUseCasesTitle: "인기 사용 사례:",
    useCase1: "자신의 콘텐츠를 위한 비디오 썸네일 만들기",
    useCase2: "썸네일 디자인 트렌드 조사",
    useCase3: "교육 프레젠테이션용 썸네일 저장",
    useCase4: "콘텐츠 라이브러리 및 무드 보드 구축",
    useCase5: "마케팅 조사를 위한 경쟁사 썸네일 분석",
    faqTitle: "자주 묻는 질문 (FAQ)",
    faqQ1: "YouTube 썸네일을 어떻게 다운로드하나요?",
    faqA1:
      '이 페이지의 입력란에 전체 YouTube 동영상 URL을 붙여넣고 "썸네일 가져오기"를 클릭하기만 하면 됩니다. 사용 가능한 모든 크기(HD, SD 등)를 보여드리며, 원하는 것의 "다운로드" 버튼을 클릭할 수 있습니다. 이미지는 기기의 기본 다운로드 위치에 저장됩니다.',
    faqQ2: "어떤 썸네일 해상도를 다운로드할 수 있나요?",
    faqA2:
      "여러 표준 YouTube 썸네일 해상도를 가져오려고 시도합니다: 최대 고화질(Maxres/1280x720, 사용 가능한 경우), 표준 화질(SD/640x480), 고품질(HQ/480x360) 및 중간 품질(MQ/320x180). 최고 품질(Maxres HD)은 특히 오래되었거나 덜 인기 있는 콘텐츠의 경우 모든 동영상에 대해 YouTube에서 항상 생성되는 것은 아닙니다.",
    faqQ3: "이 YouTube 썸네일 다운로더는 무료인가요?",
    faqA3:
      "예, 이 도구는 완전히 무료로 사용할 수 있습니다. 요금이나 등록 없이 필요한 만큼 썸네일을 다운로드할 수 있습니다. 계정 생성, 이메일 주소 또는 개인 정보가 필요하지 않습니다.",
    faqQ4: "비공개 동영상의 썸네일을 다운로드할 수 있나요?",
    faqA4:
      "아니요, 이 도구는 공개적으로 액세스할 수 있는 YouTube 동영상의 썸네일만 가져올 수 있습니다. 로그인이 필요한 비공개 또는 미등록 동영상의 썸네일에는 액세스할 수 없습니다. 이는 당사 도구가 아닌 YouTube 플랫폼의 제한 사항입니다.",
    faqQ5: "다운로드한 썸네일에 저작권 제한이 있나요?",
    faqA5:
      "예. YouTube 썸네일은 일반적으로 YouTube 또는 동영상 제작자가 저작권을 보유합니다. 다운로드한 썸네일은 저작권법과 YouTube 서비스 약관을 존중하는 방식으로만 사용해야 합니다. 허가 없이 자신의 콘텐츠에 사용하는 것은 침해가 될 수 있습니다. 이 도구는 편의를 위해 제공되지만(예: 미리보기, 개인 백업, 공정 사용 상황), 이미지 사용 방법에 대한 책임은 사용자에게 있습니다.",
    faqQ6: "HD(1280x720) 썸네일이 가끔 누락되는 이유는 무엇인가요?",
    faqA6:
      "YouTube는 모든 단일 동영상에 대해 `maxresdefault.jpg`(HD 1280x720) 썸네일을 자동으로 생성하지 않습니다. 인기 있거나 최근에 업로드된 동영상에서 더 일반적입니다. 사용할 수 없는 경우 `sddefault.jpg`(640x480)가 일반적으로 다음으로 좋은 품질입니다.",
    faqQ7: "모바일 기기에서 이 도구를 사용할 수 있나요?",
    faqA7:
      "저희 도구는 스마트폰과 태블릿을 포함한 웹 브라우저가 있는 모든 기기에서 작동합니다. 반응형 디자인은 화면 크기에 관계없이 원활한 경험을 보장합니다.",
    faqQ8: "다운로드한 썸네일은 어떻게 사용할 수 있나요?",
    faqA8:
       "다운로드한 썸네일은 동영상 재생 목록 만들기, 블로그 게시물, 프레젠테이션, 연구 또는 개인 컬렉션과 같은 다양한 목적으로 사용할 수 있습니다. 공공 또는 상업적 목적으로 썸네일을 사용할 때는 저작권을 존중해야 함을 기억하십시오.",
    faqQ9: "이 도구는 YouTube Shorts에서도 작동하나요?",
    faqA9:
      "예, 저희 도구는 YouTube Shorts에서도 작동합니다. YouTube Shorts URL을 붙여넣기만 하면 일반 YouTube 동영상과 마찬가지로 사용 가능한 썸네일을 추출합니다.",
    footerAbout: "회사 소개",
    footerPrivacy: "개인정보 처리방침",
    footerTerms: "서비스 약관",
    footerFaq: "FAQ",
    siteTitleFooter: "YouTube 썸네일 다운로더",
    footerRights: "All rights reserved.", // 종종 영어로 유지됨
    footerDisclaimer:
      "면책 조항: 다운로드한 썸네일은 YouTube 및 제작자의 저작권이 적용됩니다. 책임감 있게 사용하십시오.",
    aboutTitle: "이 도구에 대하여",
    aboutP1: "환영합니다! 이것은 YouTube 동영상 썸네일을 다운로드하는 간단하고 효율적인 도구입니다.",
    aboutP2:
      "콘텐츠 제작자, 마케터 및 관심 있는 모든 사람이 YouTube 동영상에서 고품질 썸네일을 빠르고 쉽게 가져올 수 있도록 이 도구를 만들었습니다. 영감이 필요하거나, 자리 표시자가 필요하거나, 콘텐츠를 보관하는 경우 이 도구를 사용하면 번거로움 없이 필요한 이미지를 얻을 수 있습니다.",
    aboutP3:
      '입력란에 YouTube 동영상 URL을 붙여넣고 "썸네일 가져오기"를 클릭한 다음 필요에 가장 적합한 해상도를 선택하기만 하면 됩니다. 이미지를 쉽게 다운로드하거나 URL을 복사할 수 있습니다.',
    aboutP4: "우리의 목표는 이 도구를 빠르고 안정적이며 사용자 친화적으로 유지하는 것입니다. 유용하게 사용하시기를 바랍니다!",
    aboutP5Strong: "참고:",
    aboutP5Text:
      "썸네일은 해당 소유자의 자산입니다. 이 도구를 책임감 있게 사용하고 저작권 규정 및 YouTube 서비스 약관을 존중하십시오.",
    privacyTitle: "개인정보 처리방침",
    privacyP1: "귀하의 개인 정보는 저희에게 중요합니다. 이 개인 정보 처리 방침은 이 도구가 정보를 처리하는 방법을 설명합니다.",
    privacyHInfo: "처리하는 정보:",
    privacyInfo1Strong: "YouTube URL:",
    privacyInfo1Text:
      "귀하가 입력한 YouTube URL은 YouTube의 공개적으로 사용 가능한 이미지 서버(img.youtube.com)에서 해당 동영상 썸네일을 가져오기 위해서만 처리됩니다. 요청 처리 후에는 이러한 URL을 저장하지 않습니다.",
    privacyInfo2Strong: "사용 데이터:",
    privacyInfo2Text:
      "개인 식별 정보는 수집하지 않습니다. 사용 현황을 파악하고 서비스를 개선하기 위해 기본적인 익명 분석(예: 페이지 조회수 또는 기능 사용, 구현된 경우)을 사용할 수 있지만 이는 개인과 연결되지 않습니다.",
    privacyInfo3Strong: "쿠키/로컬 저장소:",
    privacyInfo3Text:
      "언어 및 라이트/다크 모드 기본 설정을 기억하기 위해서만 `localStorage`를 사용합니다. 다른 추적 쿠키는 사용되지 않습니다.",
    privacyHUse: "정보 사용 방법:",
    privacyUse1: "썸네일 다운로더의 핵심 기능 제공.",
    privacyUse2: "사용자 경험 개선 (예: 다크 모드, 언어 기억).",
    privacyHShare: "정보 공유:",
    privacyShareText: "사용자가 제공한 정보나 식별 가능한 데이터를 제3자와 판매하거나 공유하지 않습니다.",
    privacyHSecurity: "보안:",
    privacySecurityText: "썸네일 이미지는 YouTube의 보안(HTTPS) 서버에서 직접 가져옵니다.",
    privacyHChanges: "본 방침의 변경:",
    privacyChangesText: "이 개인 정보 처리 방침은 수시로 업데이트될 수 있습니다. 정기적으로 검토하는 것이 좋습니다.",
    termsTitle: "서비스 약관",
    termsP1:
      "환영합니다! 당사 웹사이트 및 서비스를 이용함으로써 귀하는 다음 이용 약관을 준수하고 이에 구속되는 데 동의합니다.",
    termsH1: "1. 서비스 이용:",
    terms1a:
      "이 도구는 YouTube 동영상과 관련된 공개적으로 사용 가능한 썸네일 이미지에 액세스하고 볼 수 있는 방법을 제공합니다.",
    terms1b:
      "이 서비스는 개인적, 비상업적 용도(예: 미리보기, 참조 또는 소유하거나 사용할 권리가 있는 콘텐츠의 백업 생성(공정 사용))를 위한 것입니다.",
    terms1c:
      "귀하는 저작권 침해를 포함한 불법적인 목적으로 또는 YouTube 서비스 약관을 위반하는 방식으로 이 서비스를 사용하지 않을 것에 동의합니다.",
    termsH2: "2. 지적 재산권:",
    terms2a: "검색된 썸네일 이미지는 YouTube 또는 해당 콘텐츠 제작자에게 속합니다.",
    terms2b:
      "이 도구는 이러한 이미지에 대한 어떠한 권리도 귀하에게 부여하지 않습니다. 공정 사용 또는 개인적인 시청 범위를 넘어서는 모든 사용에 필요한 허가를 확보하는 것은 전적으로 귀하의 책임입니다.",
    termsH3: "3. 보증 부인:",
    terms3a:
      '이 도구는 어떠한 보증 없이 "있는 그대로" 제공됩니다. 당사는 서비스의 가용성, 정확성 또는 신뢰성 또는 모든 동영상에 대해 모든 썸네일 해상도가 존재함을 보증하지 않습니다.',
    terms3b: "당사는 YouTube 또는 Google LLC와 제휴하지 않습니다.",
    termsH4: "4. 책임 제한:",
    terms4Text:
      "이 도구는 이 서비스의 사용 또는 사용 불능으로 인해 발생하는 어떠한 손해에 대해서도 책임을 지지 않습니다.",
    termsH5: "5. 약관 변경:",
    terms5Text: "당사는 언제든지 이 약관을 수정할 권리를 보유합니다.",
    feedbackCopied: "이미지 URL이 복사되었습니다!",
    feedbackCopyFail: "URL 복사에 실패했습니다.",
    feedbackInvalidUrl: "잘못된 YouTube URL 형식입니다. 전체 동영상 URL을 붙여넣으세요.",
    feedbackNoUrl: "먼저 YouTube URL을 붙여넣으세요.",
    feedbackLoadError: "썸네일을 로드할 수 없습니다. 동영상이 비공개이거나 삭제되었을 수 있습니다.",
    feedbackUnexpectedError: "예상치 못한 오류가 발생했습니다.",
    resMaxHd: "최대 HD (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // --- Hindi ---
  hi: {
    siteTitle: "यूट्यूब थंबनेल डाउनलोडर",
    modeLabel: "मोड",
    mainHeadline: "यूट्यूब थंबनेल डाउनलोडर",
    introParagraph:
      "किसी भी यूट्यूब वीडियो का थंबनेल शानदार हाई-डेफिनिशन (HD), स्टैंडर्ड डेफिनिशन (SD), और अन्य उपलब्ध आकारों में जल्दी से डाउनलोड करें। बस नीचे वीडियो लिंक पेस्ट करें और 'थंबनेल प्राप्त करें' पर क्लिक करें - यह इतना आसान है!",
    urlPlaceholder: "यूट्यूब वीडियो URL पेस्ट करें (उदा. https://www.youtube.com/watch?v=...)",
    getThumbnailsBtn: "थंबनेल प्राप्त करें",
    resultsTitle: "उपलब्ध थंबनेल",
    downloadBtn: "डाउनलोड",
    copyUrlBtn: "URL कॉपी करें",
    howToTitle: "इस टूल का उपयोग कैसे करें",
    step1: "वह यूट्यूब वीडियो ढूंढें जिसका थंबनेल आप डाउनलोड करना चाहते हैं।",
    step2:
      "अपने ब्राउज़र के एड्रेस बार या यूट्यूब ऐप के शेयर विकल्पों से वीडियो का पूरा URL (वेब ​​पता) कॉपी करें।",
    step3: "कॉपी किए गए URL को इस पृष्ठ पर ऊपर दिए गए इनपुट बॉक्स में पेस्ट करें।",
    step4: '"',
    step4cont: '" बटन पर क्लिक करें।',
    step5: "टूल तुरंत उस वीडियो के लिए सभी उपलब्ध थंबनेल रिज़ॉल्यूशन प्रदर्शित करेगा।",
    step6: "वांछित थंबनेल आकार और डाउनलोड विधि चुनें:",
    step6a: '"',
    step6acont: '" बटन पर क्लिक करके छवि को सीधे अपने डिवाइस पर सहेजें।',
    step6b: '"',
    step6bcont: '" बटन पर क्लिक करके वेबसाइटों, दस्तावेज़ों में एम्बेड करने या सोशल मीडिया पर साझा करने के लिए छवि लिंक कॉपी करें।',
    step7:
      'सर्वोत्तम परिणामों के लिए, उच्चतम उपलब्ध रिज़ॉल्यूशन (आमतौर पर "Max HD") चुनें, जब तक कि आपको अपने प्रोजेक्ट के लिए किसी विशिष्ट आकार की आवश्यकता न हो।',
    howToTip:
      "<strong>प्रो टिप:</strong> आप इस टूल का उपयोग मोबाइल उपकरणों पर भी कर सकते हैं! बस यूट्यूब ऐप से यूट्यूब वीडियो लिंक को अपने ब्राउज़र में साझा करें, फिर उसे यहां पेस्ट करें।",
    whyTitle: "हमारे डाउनलोडर का उपयोग क्यों करें?",
    whyIntro: "हमारा यूट्यूब थंबनेल डाउनलोडर इन प्रमुख लाभों के साथ अन्य टूल से अलग है:",
    why1strong: "तेज और आसान",
    why1text: "एक साधारण कॉपी-पेस्ट क्रिया के साथ सेकंड में थंबनेल प्राप्त करें। कोई जटिल कदम आवश्यक नहीं है।",
    why2strong: "उच्च गुणवत्ता",
    why2text: "उपलब्ध उच्चतम रिज़ॉल्यूशन में थंबनेल डाउनलोड करें, जिसमें उपलब्ध होने पर HD (1280x720) भी शामिल है।",
    why3strong: "एकाधिक रिज़ॉल्यूशन",
    why3text: "हम विभिन्न आकारों (HD, SD, HQ, MQ) के लिए विकल्प प्रदान करते हैं ताकि आप सही फिट चुन सकें।",
    why4strong: "पूरी तरह से मुफ्त",
    why4text: "यह सभी के लिए एक मुफ्त टूल है। यूट्यूब थंबनेल डाउनलोड करने के लिए कोई छिपी हुई लागत या साइन-अप की आवश्यकता नहीं है।",
    why5strong: "कोई सॉफ्टवेयर इंस्टॉलेशन नहीं",
    why5text: "किसी भी डिवाइस (डेस्कटॉप, टैबलेट, मोबाइल) पर आपके वेब ब्राउज़र में सीधे काम करता है।",
    why6strong: "स्वच्छ और सुरक्षित",
    why6text:
      "हम एक सरल अनुभव को प्राथमिकता देते हैं और सीधे यूट्यूब के सुरक्षित सर्वर (img.youtube.com) से चित्र प्राप्त करते हैं।",
    whyConclusion:
      "यह यूट्यूब थंबनेल ग्रैबर सामग्री निर्माताओं, सोशल मीडिया प्रबंधकों, डिजाइनरों, या किसी भी व्यक्ति के लिए आदर्श है, जिसे वीडियो थंबनेल तक त्वरित पहुंच की आवश्यकता है।",
    whyUseCasesTitle: "लोकप्रिय उपयोग के मामले:",
    useCase1: "अपनी सामग्री के लिए वीडियो थंबनेल बनाना",
    useCase2: "थंबनेल डिजाइन प्रवृत्तियों पर शोध करना",
    useCase3: "शैक्षिक प्रस्तुतियों के लिए थंबनेल सहेजना",
    useCase4: "सामग्री पुस्तकालयों और मूड बोर्ड का निर्माण",
    useCase5: "विपणन अनुसंधान के लिए प्रतियोगी थंबनेल का विश्लेषण",
    faqTitle: "अक्सर पूछे जाने वाले प्रश्न (FAQ)",
    faqQ1: "मैं यूट्यूब थंबनेल कैसे डाउनलोड करूं?",
    faqA1:
      'बस इस पृष्ठ पर इनपुट बॉक्स में पूरा यूट्यूब वीडियो URL पेस्ट करें और "थंबनेल प्राप्त करें" पर क्लिक करें। हम आपको सभी उपलब्ध आकार (HD, SD, आदि) दिखाएंगे, और आप जिसे चाहते हैं उसके लिए "डाउनलोड" बटन पर क्लिक कर सकते हैं। छवि आपके डिवाइस के डिफ़ॉल्ट डाउनलोड स्थान पर सहेजी जाएगी।',
    faqQ2: "मैं कौन से थंबनेल रिज़ॉल्यूशन डाउनलोड कर सकता हूँ?",
    faqA2:
      "हम कई मानक यूट्यूब थंबनेल रिज़ॉल्यूशन लाने का प्रयास करते हैं: अधिकतम हाई डेफिनिशन (Maxres/1280x720, यदि उपलब्ध हो), स्टैंडर्ड डेफिनिशन (SD/640x480), हाई क्वालिटी (HQ/480x360), और मीडियम क्वालिटी (MQ/320x180)। उच्चतम गुणवत्ता (Maxres HD) यूट्यूब द्वारा हर वीडियो के लिए हमेशा उत्पन्न नहीं होती है, खासकर पुराने या कम लोकप्रिय सामग्री के लिए।",
    faqQ3: "क्या इस यूट्यूब थंबनेल डाउनलोडर का उपयोग करना मुफ्त है?",
    faqA3:
      "हाँ, यह टूल उपयोग करने के लिए पूरी तरह से मुफ्त है। आप बिना किसी शुल्क या पंजीकरण के जितने चाहें उतने थंबनेल डाउनलोड कर सकते हैं। हमें खाता निर्माण, ईमेल पते या किसी भी व्यक्तिगत जानकारी की आवश्यकता नहीं है।",
    faqQ4: "क्या मैं निजी वीडियो के लिए थंबनेल डाउनलोड कर सकता हूँ?",
    faqA4:
      "नहीं, यह टूल केवल सार्वजनिक रूप से सुलभ यूट्यूब वीडियो के लिए थंबनेल प्राप्त कर सकता है। निजी या असूचीबद्ध वीडियो के लिए थंबनेल जिन्हें लॉगिन की आवश्यकता होती है, उन तक पहुँचा नहीं जा सकता है। यह यूट्यूब के प्लेटफ़ॉर्म की सीमा है, हमारे टूल की नहीं।",
    faqQ5: "क्या डाउनलोड किए गए थंबनेल पर कोई कॉपीराइट प्रतिबंध हैं?",
    faqA5:
      "हाँ। यूट्यूब थंबनेल आमतौर पर या तो यूट्यूब द्वारा या वीडियो निर्माता द्वारा कॉपीराइट किए जाते हैं। आपको डाउनलोड किए गए थंबनेल का उपयोग केवल उन तरीकों से करना चाहिए जो कॉपीराइट कानूनों और यूट्यूब की सेवा की शर्तों का सम्मान करते हों। बिना अनुमति के अपनी सामग्री के लिए उनका उपयोग करना उल्लंघन हो सकता है। यह टूल सुविधा के लिए प्रदान किया गया है (उदाहरण के लिए, पूर्वावलोकन, व्यक्तिगत बैकअप, उचित उपयोग संदर्भ), लेकिन आप छवियों का उपयोग कैसे करते हैं इसके लिए आप जिम्मेदार हैं।",
    faqQ6: "HD (1280x720) थंबनेल कभी-कभी गायब क्यों होता है?",
    faqA6:
      "यूट्यूब हर एक वीडियो के लिए स्वचालित रूप से `maxresdefault.jpg` (HD 1280x720) थंबनेल उत्पन्न नहीं करता है। यह लोकप्रिय या हाल ही में अपलोड किए गए वीडियो पर अधिक आम है। यदि यह उपलब्ध नहीं है, तो `sddefault.jpg` (640x480) आमतौर पर अगली सबसे अच्छी गुणवत्ता होती है।",
    faqQ7: "क्या मैं इस टूल का उपयोग अपने मोबाइल डिवाइस पर कर सकता हूँ?",
    faqA7:
      "हमारा टूल स्मार्टफोन और टैबलेट सहित वेब ब्राउज़र वाले किसी भी डिवाइस पर काम करता है। उत्तरदायी डिज़ाइन स्क्रीन आकार की परवाह किए बिना एक सहज अनुभव सुनिश्चित करता है।",
    faqQ8: "मैं डाउनलोड किए गए थंबनेल का उपयोग कैसे कर सकता हूँ?",
    faqA8:
       "डाउनलोड किए गए थंबनेल का उपयोग विभिन्न उद्देश्यों के लिए किया जा सकता है जैसे कि वीडियो प्लेलिस्ट बनाना, ब्लॉग पोस्ट, प्रस्तुतियाँ, शोध, या व्यक्तिगत संग्रह। सार्वजनिक या व्यावसायिक उद्देश्यों के लिए थंबनेल का उपयोग करते समय कॉपीराइट का सम्मान करना याद रखें।",
    faqQ9: "क्या यह टूल यूट्यूब शॉर्ट्स के साथ काम करता है?",
    faqA9:
      "हाँ, हमारा टूल यूट्यूब शॉर्ट्स के साथ भी काम करता है। बस यूट्यूब शॉर्ट्स URL पेस्ट करें, और हम नियमित यूट्यूब वीडियो की तरह ही उपलब्ध थंबनेल निकालेंगे।",
    footerAbout: "हमारे बारे में",
    footerPrivacy: "गोपनीयता नीति",
    footerTerms: "सेवा की शर्तें",
    footerFaq: "FAQ",
    siteTitleFooter: "यूट्यूब थंबनेल डाउनलोडर",
    footerRights: "सर्वाधिकार सुरक्षित।",
    footerDisclaimer:
      "अस्वीकरण: डाउनलोड किए गए थंबनेल यूट्यूब और निर्माता के कॉपीराइट के अधीन हैं। जिम्मेदारी से उपयोग करें।",
    aboutTitle: "इस टूल के बारे में",
    aboutP1: "स्वागत है! यह यूट्यूब वीडियो थंबनेल डाउनलोड करने के लिए आपका सरल और कुशल टूल है।",
    aboutP2:
      "हमने सामग्री निर्माताओं, विपणक, और किसी भी इच्छुक व्यक्ति को यूट्यूब वीडियो से उच्च-गुणवत्ता वाले थंबनेल जल्दी और आसानी से प्राप्त करने का तरीका प्रदान करने के लिए यह टूल बनाया है। चाहे आपको प्रेरणा, प्लेसहोल्डर की आवश्यकता हो, या आप सामग्री संग्रहीत कर रहे हों, यह टूल आपको बिना किसी परेशानी के आवश्यक छवियां प्रदान करता है।",
    aboutP3:
      'बस यूट्यूब वीडियो URL को इनपुट बॉक्स में पेस्ट करें, "थंबनेल प्राप्त करें" पर क्लिक करें, और अपनी आवश्यकताओं के अनुरूप सर्वोत्तम रिज़ॉल्यूशन चुनें। आप आसानी से छवि डाउनलोड कर सकते हैं या उसका URL कॉपी कर सकते हैं।',
    aboutP4: "हमारा लक्ष्य इस टूल को तेज, विश्वसनीय और उपयोगकर्ता के अनुकूल बनाए रखना है। हमें उम्मीद है कि आप इसे उपयोगी पाएंगे!",
    aboutP5Strong: "कृपया ध्यान दें:",
    aboutP5Text:
      "थंबनेल उनके संबंधित स्वामियों की संपत्ति हैं। कृपया इस टूल का जिम्मेदारी से उपयोग करें और कॉपीराइट नियमों और यूट्यूब की सेवा की शर्तों का सम्मान करें।",
    privacyTitle: "गोपनीयता नीति",
    privacyP1: "आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। यह गोपनीयता नीति बताती है कि यह टूल जानकारी को कैसे संभालता है।",
    privacyHInfo: "हम जो जानकारी संभालते हैं:",
    privacyInfo1Strong: "यूट्यूब यूआरएल:",
    privacyInfo1Text:
      "हम आपके द्वारा दर्ज किए गए यूट्यूब यूआरएल को केवल यूट्यूब के सार्वजनिक रूप से उपलब्ध छवि सर्वर (img.youtube.com) से संबंधित वीडियो थंबनेल लाने के लिए संसाधित करते हैं। हम आपके अनुरोध को संसाधित करने के बाद इन यूआरएल को संग्रहीत नहीं करते हैं।",
    privacyInfo2Strong: "उपयोग डेटा:",
    privacyInfo2Text:
      "हम व्यक्तिगत पहचान योग्य जानकारी एकत्र नहीं करते हैं। हम उपयोग को समझने और सेवा में सुधार के लिए बुनियादी, अज्ञात विश्लेषण (जैसे पृष्ठ दृश्य या सुविधा उपयोग, यदि लागू हो) का उपयोग कर सकते हैं, लेकिन यह व्यक्तियों से जुड़ा नहीं है।",
    privacyInfo3Strong: "कुकीज़/स्थानीय भंडारण:",
    privacyInfo3Text:
      "हम `localStorage` का उपयोग केवल भाषा और प्रकाश/अंधेरे मोड के लिए आपकी वरीयता को याद रखने के लिए करते हैं। कोई अन्य ट्रैकिंग कुकीज़ का उपयोग नहीं किया जाता है।",
    privacyHUse: "हम जानकारी का उपयोग कैसे करते हैं:",
    privacyUse1: "थंबनेल डाउनलोडर की मुख्य कार्यक्षमता प्रदान करने के लिए।",
    privacyUse2: "उपयोगकर्ता अनुभव को बेहतर बनाने के लिए (जैसे, डार्क मोड, भाषा याद रखना)।",
    privacyHShare: "जानकारी साझा करना:",
    privacyShareText: "हम किसी भी उपयोगकर्ता द्वारा प्रदान की गई जानकारी या पहचान योग्य डेटा को तीसरे पक्ष को बेचते या साझा नहीं करते हैं।",
    privacyHSecurity: "सुरक्षा:",
    privacySecurityText: "थंबनेल छवियां सीधे यूट्यूब के सुरक्षित (HTTPS) सर्वर से प्राप्त की जाती हैं।",
    privacyHChanges: "इस नीति में परिवर्तन:",
    privacyChangesText: "हम समय-समय पर इस गोपनीयता नीति को अपडेट कर सकते हैं। हम आपको समय-समय पर इसकी समीक्षा करने के लिए प्रोत्साहित करते हैं।",
    termsTitle: "सेवा की शर्तें",
    termsP1:
      "स्वागत है! हमारी वेबसाइट और सेवाओं का उपयोग करके, आप निम्नलिखित नियमों और शर्तों का पालन करने और उनसे बंधे होने के लिए सहमत हैं।",
    termsH1: "1. सेवा का उपयोग:",
    terms1a:
      "यह टूल यूट्यूब वीडियो से जुड़े सार्वजनिक रूप से उपलब्ध थंबनेल छवियों तक पहुंचने और देखने का एक तरीका प्रदान करता है।",
    terms1b:
      "यह सेवा व्यक्तिगत, गैर-व्यावसायिक उपयोग के लिए अभिप्रेत है, जैसे कि आपके स्वामित्व वाली या उपयोग करने के अधिकार वाली सामग्री के लिए पूर्वावलोकन, संदर्भ या बैकअप बनाना (उचित उपयोग)।",
    terms1c:
      "आप इस सेवा का उपयोग किसी भी गैरकानूनी उद्देश्य के लिए नहीं करने के लिए सहमत हैं, जिसमें कॉपीराइट उल्लंघन, या किसी भी तरह से यूट्यूब की सेवा की शर्तों का उल्लंघन शामिल है।",
    termsH2: "2. बौद्धिक संपदा:",
    terms2a: "पुनर्प्राप्त थंबनेल छवियां यूट्यूब या संबंधित सामग्री निर्माताओं की हैं।",
    terms2b:
      "यह टूल आपको इन छवियों पर कोई अधिकार प्रदान नहीं करता है। आप यह सुनिश्चित करने के लिए पूरी तरह से जिम्मेदार हैं कि आपके पास उचित उपयोग या व्यक्तिगत देखने से परे किसी भी उपयोग के लिए आवश्यक अनुमतियां हैं।",
    termsH3: "3. वारंटियों का अस्वीकरण:",
    terms3a:
      'यह टूल बिना किसी वारंटी के "जैसा है" प्रदान किया गया है। हम सेवा की उपलब्धता, सटीकता, या विश्वसनीयता की गारंटी नहीं देते हैं, न ही यह कि प्रत्येक वीडियो के लिए सभी थंबनेल रिज़ॉल्यूशन मौजूद होंगे।',
    terms3b: "हम यूट्यूब या गूगल एलएलसी से संबद्ध नहीं हैं।",
    termsH4: "4. दायित्व की सीमा:",
    terms4Text:
      "यह टूल इस सेवा के उपयोग या उपयोग करने में असमर्थता के परिणामस्वरूप होने वाले किसी भी नुकसान के लिए उत्तरदायी नहीं होगा।",
    termsH5: "5. शर्तों में परिवर्तन:",
    terms5Text: "हम किसी भी समय इन शर्तों को संशोधित करने का अधिकार सुरक्षित रखते हैं।",
    feedbackCopied: "छवि URL कॉपी किया गया!",
    feedbackCopyFail: "URL कॉपी करने में विफल।",
    feedbackInvalidUrl: "अमान्य यूट्यूब URL प्रारूप। कृपया पूरा वीडियो URL पेस्ट करें।",
    feedbackNoUrl: "कृपया पहले यूट्यूब URL पेस्ट करें।",
    feedbackLoadError: "कोई थंबनेल लोड नहीं हो सका। वीडियो निजी या हटाया जा सकता है।",
    feedbackUnexpectedError: "एक अप्रत्याशित त्रुटि हुई।",
    resMaxHd: "मैक्स HD (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
};
