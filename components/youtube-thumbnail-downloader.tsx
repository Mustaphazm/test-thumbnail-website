"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"

export default function YouTubeThumbnailDownloader() {
  // State for UI elements
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState("en")
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

    // Load saved language
    const savedLang = localStorage.getItem("selectedLanguage") || navigator.language.split("-")[0] || "en"
    const validLang = translations[savedLang as keyof typeof translations] ? savedLang : "en"
    setLanguage(validLang)

    // Set HTML lang attribute
    document.documentElement.setAttribute("lang", validLang)

    // Translate page
    translatePage(validLang)
  }, [])

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

    // Show feedback
    const langName = e.target.options[e.target.selectedIndex].text
    displayFeedback(`Language changed to ${langName}.`, 3000)
  }

  // Display feedback message
  const displayFeedback = (message: string, duration = 3000, isTranslationKey = false) => {
    if (isTranslationKey) {
      const translationSet = translations[language as keyof typeof translations] || translations.en
      message =
        translationSet[message as keyof typeof translationSet] ||
        translations.en[message as keyof typeof translations.en] ||
        message
    }

    setFeedbackMessage(message)
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
    const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = url.match(regExp)

    if (thumbnailsGridRef.current) {
      thumbnailsGridRef.current.innerHTML = "" // Clear previous results
    }

    setShowResults(false) // Hide results initially

    if (match && match[1]) {
      const videoID = match[1]
      const thumbnailBaseUrl = "https://img.youtube.com/vi/" // HTTPS

      setShowResults(true) // Show results section

      // Get localized resolution names
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

        // Create thumbnail option element
        const optionDiv = document.createElement("div")
        optionDiv.className = "thumbnail-option"
        optionDiv.classList.add("thumb-" + option.code)

        const imgContainer = document.createElement("div")
        imgContainer.className = "img-container"

        const img = document.createElement("img")
        img.src = thumbnailUrl
        img.alt = `Thumbnail for ${videoID} - ${resolutionText}`
        img.loading = "lazy"

        let imageLoadedSuccessfully = false
        img.onload = () => {
          foundAny = true
          imageLoadedSuccessfully = true
        }

        img.onerror = () => {
          console.warn(`Thumbnail not found or failed to load: ${resolutionText} (${thumbnailUrl})`)
          img.classList.add("img-error")

          // Hide the card only if it's not maxresdefault *and* it failed to load
          if (option.code !== "maxresdefault") {
            // Use a slight delay to check if load event fired
            setTimeout(() => {
              if (!imageLoadedSuccessfully) {
                optionDiv.style.display = "none" // Hide failed non-maxres cards
              }
            }, 50) // Short delay
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
        downloadLink.textContent = translationSet.downloadBtn || translations.en.downloadBtn
        downloadLink.className = "btn btn-secondary"
        downloadLink.setAttribute("download", `thumbnail_${videoID}_${option.code}.jpg`)
        downloadLink.setAttribute("target", "_blank")
        downloadLink.setAttribute("rel", "noopener noreferrer")

        // Copy URL Button
        const copyButton = document.createElement("button")
        copyButton.textContent = translationSet.copyUrlBtn || translations.en.copyUrlBtn
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

      // Check after a delay if any *visible* thumbnails were loaded
      setTimeout(() => {
        if (thumbnailsGridRef.current) {
          const visibleCards = thumbnailsGridRef.current.querySelectorAll(
            '.thumbnail-option:not([style*="display: none"])',
          )
          if (!foundAny && visibleCards.length === 0) {
            displayFeedback("feedbackLoadError", 5000, true)
            setShowResults(false)
          } else if (thumbnailsGridRef.current.childElementCount > 0 && visibleCards.length === 0) {
            // Edge case: all cards added but immediately hidden due to errors
            displayFeedback("feedbackLoadError", 5000, true)
            setShowResults(false)
          }
        }
      }, 1500) // Check after images have had time to load/error

      // Clear input after processing
      if (videoUrlInputRef.current) {
        videoUrlInputRef.current.value = ""
      }
    } else {
      displayFeedback("feedbackInvalidUrl", 4000, true)
      setShowResults(false)
    }
  }

  // Handle download button click
  const handleDownloadClick = () => {
    if (videoUrlInputRef.current) {
      const url = videoUrlInputRef.current.value.trim()
      if (url) {
        getYouTubeThumbnail(url)
      } else {
        displayFeedback("feedbackNoUrl", 3000, true)
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

  // Translate page based on language
  const translatePage = (lang: string) => {
    const translationSet = translations[lang as keyof typeof translations] || translations.en

    document.querySelectorAll("[data-translate]").forEach((element) => {
      const key = element.getAttribute("data-translate")
      if (key && translationSet[key as keyof typeof translationSet]) {
        element.textContent = translationSet[key as keyof typeof translationSet]
      }
    })

    document.querySelectorAll("[data-translate-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-translate-placeholder")
      if (key && translationSet[key as keyof typeof translationSet] && element instanceof HTMLInputElement) {
        element.placeholder = translationSet[key as keyof typeof translationSet]
      }
    })
  }

  // Handle key press in input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleDownloadClick()
    }
  }

  return (
    <>
      {/* Feedback Message Area */}
      <div id="feedbackMessage" className={`feedback-message ${showFeedback ? "show" : ""}`}>
        {feedbackMessage}
      </div>

      <header className="container">
        <div className="logo-area">
          <h1 data-translate="siteTitle">YouTube Thumbnail Downloader</h1>
        </div>
        <div className="controls">
          <div className="language-select">
            <select id="languageSelector" aria-label="Select Language" value={language} onChange={handleLanguageChange}>
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
        <section className="intro">
          <h2 data-translate="mainHeadline">Downloader YouTube Thumbnail</h2>
          <p data-translate="introParagraph">
            Quickly download any YouTube video's thumbnail in stunning high-definition (HD), standard definition (SD),
            and other available sizes. Just paste the video link below and click 'Get Thumbnails' – it's that simple!
          </p>
        </section>

        <section className="input-area">
          <input
            type="text"
            id="videoUrlInput"
            ref={videoUrlInputRef}
            placeholder="Paste YouTube video URL (e.g., https://www.youtube.com/watch?v=...)"
            aria-label="YouTube Video URL"
            data-translate-placeholder="urlPlaceholder"
            onKeyPress={handleKeyPress}
          />
          <button
            className="btn btn-primary"
            id="downloadBtn"
            data-translate="getThumbnailsBtn"
            onClick={handleDownloadClick}
          >
            Get Thumbnails
          </button>
        </section>

        {/* Thumbnail Results Area */}
        <section id="thumbnailResults" className={showResults ? "" : "hidden"}>
          <h2 data-translate="resultsTitle">Available Thumbnails</h2>
          <div className="thumbnails-grid" id="thumbnailsGrid" ref={thumbnailsGridRef}>
            {/* Thumbnails will be inserted here by JavaScript */}
          </div>
        </section>

        {/* How to Use Section - Enhanced (Structure for translation maintained) */}
        <section className="content-section enhanced">
          <h2 data-translate="howToTitle">How to Use This Tool</h2>
          <ol className="step-guide">
            <li data-translate="step1">Find the YouTube video whose thumbnail you want to download.</li>
            <li data-translate="step2">
              Copy the full URL (web address) of the video from your browser's address bar or the YouTube app's share
              options.
            </li>
            <li data-translate="step3">Paste the copied URL into the input box provided above on this page.</li>
            <li>
              <span data-translate="step4">Click the "</span>
              <strong data-translate="getThumbnailsBtn">Get Thumbnails</strong>
              <span data-translate="step4cont">" button.</span>
            </li>
            <li data-translate="step5">
              The tool will instantly display all available thumbnail resolutions for that video.
            </li>
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
                  <span data-translate="step6bcont">
                    " button to copy the image link for embedding in websites, documents, or sharing on social media.
                  </span>
                </li>
              </ul>
            </li>
            <li data-translate="step7">
              For best results, choose the highest resolution available (usually "Max HD") unless you need a specific
              size for your project.
            </li>
          </ol>
          <p className="tip" data-translate="howToTip">
            <strong>Pro Tip:</strong> You can use this tool on mobile devices too! Just share the YouTube video link
            from the YouTube app to your browser, then paste it here.
          </p>
        </section>

        {/* Why Choose Us Section - Enhanced with feature cards */}
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

        {/* FAQ Section - Enhanced */}
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
                onClick={(e) => {
                  e.preventDefault()
                  openModal("aboutModal")
                }}
                data-translate="footerAbout"
              >
                About Us
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  openModal("privacyModal")
                }}
                data-translate="footerPrivacy"
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  openModal("termsModal")
                }}
                data-translate="footerTerms"
              >
                Terms of Service
              </a>
            </li>
            <li>
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

      {/* Modals */}
      {currentModal === "aboutModal" && (
        <div id="aboutModal" className="modal" style={{ display: "flex" }}>
          <div className="modal-content">
            <span className="modal-close" onClick={closeModal}>
              ×
            </span>
            <h2 data-translate="aboutTitle">About This Tool</h2>
            <p data-translate="aboutP1">
              Welcome! This is your simple and efficient tool for downloading YouTube video thumbnails.
            </p>
            <p data-translate="aboutP2">
              We created this tool to provide a quick and easy way for content creators, marketers, and anyone
              interested to grab high-quality thumbnails from YouTube videos. Whether you need inspiration,
              placeholders, or are archiving content, this tool gets you the images you need without hassle.
            </p>
            <p data-translate="aboutP3">
              Simply paste the YouTube video URL into the input box, click "Get Thumbnails", and choose the resolution
              that best suits your needs. You can easily download the image or copy its URL.
            </p>
            <p data-translate="aboutP4">
              Our goal is to keep this tool fast, reliable, and user-friendly. We hope you find it useful!
            </p>
            <p>
              <strong data-translate="aboutP5Strong">Please Note:</strong>{" "}
              <span data-translate="aboutP5Text">
                Thumbnails are the property of their respective owners. Please use this tool responsibly and respect
                copyright regulations and YouTube's Terms of Service.
              </span>
            </p>
          </div>
        </div>
      )}

      {currentModal === "privacyModal" && (
        <div id="privacyModal" className="modal" style={{ display: "flex" }}>
          <div className="modal-content">
            <span className="modal-close" onClick={closeModal}>
              ×
            </span>
            <h2 data-translate="privacyTitle">Privacy Policy</h2>
            <p data-translate="privacyP1">
              Your privacy is important to us. This Privacy Policy explains how this tool handles information.
            </p>
            <p>
              <strong data-translate="privacyHInfo">Information We Handle:</strong>
            </p>
            <ul>
              <li>
                <strong data-translate="privacyInfo1Strong">YouTube URLs:</strong>{" "}
                <span data-translate="privacyInfo1Text">
                  We process the YouTube URLs you enter solely to fetch the corresponding video thumbnails from
                  YouTube's publicly available image servers (img.youtube.com). We do not store these URLs after
                  processing your request.
                </span>
              </li>
              <li>
                <strong data-translate="privacyInfo2Strong">Usage Data:</strong>{" "}
                <span data-translate="privacyInfo2Text">
                  We do not collect personal identifying information. We may use basic, anonymous analytics (like page
                  views or feature usage, if implemented) to understand usage and improve the service, but this is not
                  linked to individuals.
                </span>
              </li>
              <li>
                <strong data-translate="privacyInfo3Strong">Cookies/Local Storage:</strong>{" "}
                <span data-translate="privacyInfo3Text">
                  We use `localStorage` only to remember your preference for language and light/dark mode. No other
                  tracking cookies are used.
                </span>
              </li>
            </ul>
            <p>
              <strong data-translate="privacyHUse">How We Use Information:</strong>
            </p>
            <ul>
              <li data-translate="privacyUse1">To provide the core functionality of the thumbnail downloader.</li>
              <li data-translate="privacyUse2">
                To improve the user experience (e.g., remembering dark mode, language).
              </li>
            </ul>
            <p>
              <strong data-translate="privacyHShare">Information Sharing:</strong>{" "}
              <span data-translate="privacyShareText">
                We do not sell or share any user-provided information or identifiable data with third parties.
              </span>
            </p>
            <p>
              <strong data-translate="privacyHSecurity">Security:</strong>{" "}
              <span data-translate="privacySecurityText">
                Thumbnail images are fetched directly from YouTube's secure (HTTPS) servers.
              </span>
            </p>
            <p>
              <strong data-translate="privacyHChanges">Changes to this Policy:</strong>{" "}
              <span data-translate="privacyChangesText">
                We may update this Privacy Policy occasionally. We encourage you to review it periodically.
              </span>
            </p>
          </div>
        </div>
      )}

      {currentModal === "termsModal" && (
        <div id="termsModal" className="modal" style={{ display: "flex" }}>
          <div className="modal-content">
            <span className="modal-close" onClick={closeModal}>
              ×
            </span>
            <h2 data-translate="termsTitle">Terms of Service</h2>
            <p data-translate="termsP1">
              Welcome! By using our website and services, you agree to comply with and be bound by the following terms
              and conditions.
            </p>
            <p>
              <strong data-translate="termsH1">1. Use of Service:</strong>
            </p>
            <ul>
              <li data-translate="terms1a">
                This tool provides a way to access and view publicly available thumbnail images associated with YouTube
                videos.
              </li>
              <li data-translate="terms1b">
                This service is intended for personal, non-commercial use, such as previewing, referencing, or creating
                backups for content you own or have rights to use (fair use).
              </li>
              <li data-translate="terms1c">
                You agree not to use this service for any unlawful purpose, including copyright infringement, or in any
                way that violates YouTube's Terms of Service.
              </li>
            </ul>
            <p>
              <strong data-translate="termsH2">2. Intellectual Property:</strong>
            </p>
            <ul>
              <li data-translate="terms2a">
                The thumbnail images retrieved belong to YouTube or the respective content creators.
              </li>
              <li data-translate="terms2b">
                This tool does not grant you any rights to these images. You are solely responsible for ensuring you
                have the necessary permissions for any use beyond fair use or personal viewing.
              </li>
            </ul>
            <p>
              <strong data-translate="termsH3">3. Disclaimer of Warranties:</strong>
            </p>
            <ul>
              <li data-translate="terms3a">
                This tool is provided "as is" without any warranties. We do not guarantee the availability, accuracy, or
                reliability of the service or that all thumbnail resolutions will exist for every video.
              </li>
              <li data-translate="terms3b">We are not affiliated with YouTube or Google LLC.</li>
            </ul>
            <p>
              <strong data-translate="termsH4">4. Limitation of Liability:</strong>{" "}
              <span data-translate="terms4Text">
                This tool shall not be liable for any damages resulting from the use or inability to use this service.
              </span>
            </p>
            <p>
              <strong data-translate="termsH5">5. Changes to Terms:</strong>{" "}
              <span data-translate="terms5Text">We reserve the right to modify these terms at any time.</span>
            </p>
          </div>
        </div>
      )}

      {/* Schema.org structured data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Downloader YouTube Thumbnail",
          url: "https://yourdomain.com",
          description:
            "Free online tool to download YouTube video thumbnails in high quality. Get HD, SD and multiple resolution thumbnails instantly.",
          applicationCategory: "UtilityApplication",
          operatingSystem: "All",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          featureList: [
            "Download YouTube thumbnails in HD quality",
            "Multiple resolution options",
            "No registration required",
            "Works on all devices",
            "Free to use",
          ],
        })}
      </script>
    </>
  )
}

// Translation data
const translations = {
  en: {
    siteTitle: "YouTube Thumbnail Downloader",
    modeLabel: "Mode",
    mainHeadline: "Downloader YouTube Thumbnail",
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
  ar: {
    /* Arabic translations preserved from original code */
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
  es: {
    // Example Spanish update
    siteTitle: "Descargador de Miniaturas de YouTube",
    mainHeadline: "Descargador YouTube Miniatura", // Changed Headline
    // ... rest of Spanish translations
    feedbackCopied: "¡URL de imagen copiada!",
    feedbackCopyFail: "Error al copiar URL.",
    feedbackInvalidUrl: "Formato de URL de YouTube inválido. Por favor, pega la URL completa del video.",
    feedbackNoUrl: "Por favor, pega primero una URL de YouTube.",
    feedbackLoadError: "No se pudieron cargar miniaturas. El video podría ser privado o haber sido eliminado.",
    feedbackUnexpectedError: "Ocurrió un error inesperado.",
    resMaxHd: "HD Máx (1280x720)",
    resSd: "SD (640x480)",
    resHq: "HQ (480x360)",
    resMq: "MQ (320x180)",
  },
  // Add other language translations here, potentially updating mainHeadline
}
