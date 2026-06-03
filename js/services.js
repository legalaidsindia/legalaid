/**
 * ==========================================================================
 * LegalAidIndia.org — Services Section Interactivity
 * ==========================================================================
 *
 * Handles: tab switching, document-tool form submission & progress,
 * case-law search, lawyer marketplace filters, service-card interactions.
 *
 * Selectors matched to index.html IDs/classes and components.css BEM.
 *
 * @version 2.0.0
 */

'use strict';

/* -----------------------------------------------------------------------
   Bootstrap
   ----------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initTabSwitcher();
  initDocumentTools();
  initCaseSearch();
  initLawyerFilters();
  initServiceCardInteractions();
  initLibraryTab();
});

/* -----------------------------------------------------------------------
   1. Tab Switching
   ----------------------------------------------------------------------- */

function initTabSwitcher() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content');

  if (!tabBtns.length || !tabPanels.length) return;

  const activateTab = (tabId) => {
    // Toggle button active — add both JS class and BEM class
    tabBtns.forEach((btn) => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      btn.classList.toggle('tabs__btn--active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    // Toggle panel visibility
    tabPanels.forEach((panel) => {
      // Match by ID: tab-contracts → data-tab="contracts"
      const panelId = panel.id.replace('tab-', '');
      const isActive = panelId === tabId;

      panel.classList.toggle('active', isActive);
      panel.classList.toggle('tabs__panel--active', isActive);

      if (isActive) {
        panel.style.display = 'block';
        panel.removeAttribute('hidden');
      } else {
        panel.style.display = 'none';
        panel.setAttribute('hidden', '');
      }
    });
  };

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      if (tabId) activateTab(tabId);
    });

    // Keyboard: arrow keys
    btn.addEventListener('keydown', (e) => {
      const btnsArr = [...tabBtns];
      const idx = btnsArr.indexOf(btn);
      let targetIdx = -1;

      if (e.key === 'ArrowRight') targetIdx = (idx + 1) % btnsArr.length;
      if (e.key === 'ArrowLeft') targetIdx = (idx - 1 + btnsArr.length) % btnsArr.length;

      if (targetIdx >= 0) {
        e.preventDefault();
        btnsArr[targetIdx].focus();
        btnsArr[targetIdx].click();
      }
    });
  });
}

/* -----------------------------------------------------------------------
   2. Document Tool Form Submission
   ----------------------------------------------------------------------- */

function initDocumentTools() {
  // All .form-submit buttons inside .tabs__panel
  const submitBtns = document.querySelectorAll('.tabs__panel .form-submit, .tab-content .form-submit');

  submitBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      // Find the parent glass-panel
      const glassPanel = btn.closest('.glass-panel');
      if (!glassPanel) return;

      // Remove any existing progress/success
      const existing = glassPanel.querySelector('.doc-progress');
      if (existing) existing.remove();

      // Validate fields
      if (!validatePanel(glassPanel)) return;

      // Run generation simulation
      simulateDocGeneration(glassPanel, btn);
    });
  });
}

/**
 * Validate form fields inside a glass-panel container.
 */
function validatePanel(panel) {
  let isValid = true;

  // Clear previous errors
  panel.querySelectorAll('.field-error').forEach((el) => el.remove());
  panel.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

  // Check selects (must not be empty string)
  const selects = panel.querySelectorAll('.form-group__select');
  selects.forEach((select) => {
    if (!select.value) {
      markFieldError(select, 'Please select an option');
      isValid = false;
    }
  });

  // Check text inputs (only if they have a value or look required)
  const inputs = panel.querySelectorAll('.form-group__input');
  inputs.forEach((input) => {
    if (input.hasAttribute('required') && !input.value.trim()) {
      markFieldError(input, 'This field is required');
      isValid = false;
    }
    // Email validation
    if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      markFieldError(input, 'Please enter a valid email');
      isValid = false;
    }
  });

  return isValid;
}

function markFieldError(field, message) {
  field.classList.add('input-error');

  const error = document.createElement('span');
  error.className = 'field-error';
  error.textContent = message;
  error.setAttribute('role', 'alert');

  // Insert after the field
  field.parentNode.insertBefore(error, field.nextSibling);

  field.addEventListener('input', () => {
    field.classList.remove('input-error');
    if (error.parentNode) error.remove();
  }, { once: true });

  field.addEventListener('change', () => {
    field.classList.remove('input-error');
    if (error.parentNode) error.remove();
  }, { once: true });
}

let compiledTemplates = null;

// Load professional legal templates compiled from the E: drive
fetch('js/document_templates.json')
  .then((res) => {
    if (res.ok) return res.json();
    throw new Error('Templates JSON file not found');
  })
  .then((data) => {
    compiledTemplates = data;
    console.log('Successfully loaded professional legal draft templates.');
  })
  .catch((err) => {
    console.warn('Could not load professional RTF templates. Falling back to default mock templates.', err);
  });

/**
 * Collect values from input fields and map them to their corresponding template.
 */
function generateDocumentText(panel) {
  const select = panel.querySelector('.form-group__select');
  const type = select ? select.value : '';

  const inputs = [...panel.querySelectorAll('.form-group__input')];
  const textarea = panel.querySelector('.form-group__textarea');

  const val1 = inputs[0] ? inputs[0].value.trim() : '';
  const val2 = inputs[1] ? inputs[1].value.trim() : '';
  const detailVal = textarea ? textarea.value.trim() : '';

  let templateKey = '';
  if (panel.id === 'tab-contracts') {
    if (type === 'rental') templateKey = 'rental';
    else if (type === 'employment') templateKey = 'employment';
  } else if (panel.id === 'tab-notices') {
    if (type === 'eviction') templateKey = 'eviction';
    else if (type === 'demand') templateKey = 'demand';
    else templateKey = 'sec138';
  } else if (panel.id === 'tab-fir') {
    templateKey = 'criminal_complaint';
  } else if (panel.id === 'tab-rti') {
    templateKey = 'rti';
  }

  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  if (compiledTemplates && compiledTemplates[templateKey]) {
    let text = compiledTemplates[templateKey].template_text;

    if (templateKey === 'rental') {
      let replaced = text;
      replaced = replaced.replace(/M\/S\.\s*ABC/g, val1 || "Landlord");
      replaced = replaced.replace(/X\s*Y\s*Z/g, val2 || "Tenant");
      replaced = replaced.replace(/XYZ/g, val2 || "Tenant");
      replaced = replaced.replace(/this\s*______________\s*day\s*of\s*____________\s*200___/g, `this ${new Date().getDate()} day of ${new Date().toLocaleString('en-IN', {month: 'long'})} ${new Date().getFullYear()}`);
      replaced = replaced.replace(/effect\s*from\s*______________\s*day\s*of\s*_________\s*200___/g, `effect from ${new Date().getDate()} day of ${new Date().toLocaleString('en-IN', {month: 'long'})} ${new Date().getFullYear()}`);
      return replaced;
    }

    if (templateKey === 'employment') {
      let replaced = text;
      replaced = replaced.replace(/Shri\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./g, val1 || "Employee");
      replaced = replaced.replace(/company/g, val2 || "Company");
      replaced = replaced.replace(/Manager/g, `${val2 || "Company"} Management`);
      replaced = replaced.replace(/Date\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./g, `Date: ${dateStr}`);
      replaced = replaced.replace(/effect\s*from\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./g, `effect from ${dateStr}`);
      return replaced;
    }

    if (templateKey === 'eviction') {
      let replaced = text;
      replaced = replaced.replace(/Smt\s*\.\s*X/g, val1 || "Landlord/Owner");
      replaced = replaced.replace(/Shri\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./g, "Tenant");
      replaced = replaced.replace(/premises\s*No\.\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./g, `premises described as: ${detailVal || "Leased Premises"}`);
      replaced = replaced.replace(/Date\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./g, `Date: ${dateStr}`);
      return replaced;
    }

    if (templateKey === 'demand') {
      let replaced = text;
      replaced = replaced.replace(/clients\s*…………………………/g, val1 || "Creditor Name");
      replaced = replaced.replace(/Rs…………/g, `Rs. ${detailVal || "Outstanding Amount"}`);
      return replaced;
    }

    if (templateKey === 'sec138') {
      let replaced = text;
      replaced = replaced.replace(/client\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./g, val1 || "Complainant");
      replaced = replaced.replace(/Rs\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./g, `Rs. ${detailVal || "Cheque Amount"}`);
      replaced = replaced.replace(/Dated\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./g, `Dated: ${dateStr}`);
      return replaced;
    }

    if (templateKey === 'criminal_complaint') {
      let replaced = text;
      replaced = replaced.replace(/XYZ\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\s*Complainant/g, `${val2 || "Complainant"}`);
      replaced = replaced.replace(/Police\s*Station:\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./g, `Police Station: ${val1 || "Incident Location"}`);
      replaced = replaced.replace(/\(Set\s*out\s*herein\s*the\s*complaint\)/g, `STATEMENT OF COMPLAINT:\n${detailVal || "Details of Incident"}`);
      replaced = replaced.replace(/sum\s*of\s*Rs\s*\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./g, `incident occurring at ${val1 || "Location"} on ${dateStr}`);
      return replaced;
    }

    return text;
  }

  // Predefined/Fallback templates for remaining selects and RTI
  if (templateKey === 'rti') {
    return `APPLICATION FOR OBTAINING INFORMATION UNDER THE RIGHT TO INFORMATION ACT, 2005

To,
The Public Information Officer (PIO)
Office/Department: ${val1 || "Concerned Department"}
Authority Level: ${type.toUpperCase()} GOVERNMENT

1. Full Name of the Applicant: Applicant (Citizen of India)
2. Address for Correspondence: Provided in account profile
3. Particulars of Information required under Section 6(1) of the RTI Act:
   ${detailVal || "Specific information details requested"}
4. Period for which information is required: Recent (last 1-2 years)
5. Whether the applicant belongs to BPL Category: No
6. Proof of Payment of Application Fee: Rs. 10/- Paid via Postal Order / Online.

Place: India
Date: ${dateStr}

_______________________
Signature of Applicant`;
  }

  if (type === 'nda') {
    return `MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement is made and entered into on this ${dateStr} BY AND BETWEEN:
Disclosing Party: ${val1 || "Party A"}
AND
Receiving Party: ${val2 || "Party B"}

1. Purpose: The parties wish to explore a business relationship where Confidential Information may be shared.
2. Confidential Information: Includes all technical, financial, or business information disclosed.
3. Term: The obligations of confidentiality shall remain in effect for 3 years from the date of disclosure.

IN WITNESS WHEREOF, the parties hereto have signed this Agreement.

__________________                   __________________
Disclosing Party                     Receiving Party`;
  }

  if (type === 'partnership') {
    return `PARTNERSHIP DEED

THIS DEED OF PARTNERSHIP is made on this ${dateStr} BY AND BETWEEN:
Partner 1: ${val1 || "Partner A"}
AND
Partner 2: ${val2 || "Partner B"}

1. Name and Business: The partners shall carry on business under mutual agreement.
2. Capital Contribution: The partners shall contribute capital in equal shares.
3. Profit Sharing Ratio: Profits and losses shall be shared equally between the partners.
4. Dispute Resolution: Any disputes shall be resolved via arbitration.

IN WITNESS WHEREOF, the partners have set their hands to this deed.

__________________                   __________________
Partner 1                            Partner 2`;
  }

  if (type === 'service') {
    return `SERVICE AGREEMENT

THIS SERVICE AGREEMENT is entered into on this ${dateStr} BY AND BETWEEN:
Service Provider: ${val1 || "Service Provider"}
AND
Client: ${val2 || "Client"}

1. Services: The Provider agrees to perform services as requested.
2. Compensation: The Client shall pay for services rendered under agreed terms.
3. Termination: Either party may terminate this agreement with 15 days written notice.

IN WITNESS WHEREOF, the parties have signed this Agreement.

__________________                   __________________
Service Provider                     Client`;
  }

  if (type === 'cease') {
    return `LEGAL CEASE & DESIST NOTICE

Registered Post A.D.
Date: ${dateStr}

To,
Recipient Party

From:
Sender: ${val1 || "Sender Name"}

RE: Immediate Cease and Desist Command regarding ongoing matter

Dear Sir/Madam,
Under instructions from our client, ${val1 || "Sender"}, we hereby demand that you immediately cease and desist from the following activity:
${detailVal || "Specific details of violations"}

Failure to comply with this notice within 10 days will compel our client to initiate appropriate legal actions against you in a court of competent jurisdiction.

Yours sincerely,
Advocate for Sender`;
  }

  if (type === 'reply') {
    return `REPLY TO LEGAL NOTICE

Date: ${dateStr}

To,
Opposing Party / Advocate

From:
Sender: ${val1 || "Sender Name"}

RE: Reply to your legal notice dated recently

Dear Sir/Madam,
On behalf of our client, ${val1 || "Sender"}, we hereby reply to your notice as follows:
1. That all allegations made in your notice are false, frivolous, and vexatious.
2. That our client responds to the matter in detail:
   ${detailVal || "Factual reply statement"}
We call upon you to withdraw your notice immediately, failing which we shall claim damages.

Yours sincerely,
Advocate for Client`;
  }

  // Fallback template
  return `PREMIUM LEGAL DOCUMENT\n\nDate: ${dateStr}\n\nParty 1/Sender: ${val1 || 'N/A'}\nParty 2/Recipient: ${val2 || 'N/A'}\n\nSubject/Details:\n${detailVal || 'N/A'}\n\nThis is a fallback template. Please run the extract_drafts.py script to compile RTF templates into js/document_templates.json.`;
}

/**
 * Simulate document generation with progress bar.
 */
function simulateDocGeneration(panel, btn) {
  btn.disabled = true;
  btn.innerHTML = '<span class="pulse-animation">⏳</span> Generating...';

  const progress = document.createElement('div');
  progress.className = 'doc-progress';
  progress.innerHTML = `
    <div class="doc-progress__bar">
      <div class="doc-progress__fill"></div>
    </div>
    <p class="doc-progress__label">Generating your document…</p>
  `;

  panel.appendChild(progress);

  const fill = progress.querySelector('.doc-progress__fill');
  const label = progress.querySelector('.doc-progress__label');

  let pct = 0;
  const interval = setInterval(() => {
    pct += Math.random() * 20 + 10;
    if (pct > 100) pct = 100;

    fill.style.width = `${pct}%`;

    if (pct >= 30 && pct < 60) {
      label.textContent = 'Analyzing legal requirements…';
    } else if (pct >= 60 && pct < 90) {
      label.textContent = 'Drafting document sections…';
    } else if (pct >= 90) {
      label.textContent = 'Finalizing document…';
    }

    if (pct >= 100) {
      clearInterval(interval);
      const docText = generateDocumentText(panel);
      showDocSuccess(progress, btn, docText);
    }
  }, 200);
}

function showDocSuccess(progressEl, btn, docText) {
  const panel = btn.closest('.glass-panel');
  const select = panel ? panel.querySelector('.form-group__select') : null;
  const docTitle = select && select.value ? select.options[select.selectedIndex].text : "Generated Legal Draft";

  progressEl.innerHTML = `
    <div class="doc-success">
      <svg class="doc-success__icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 12l3 3 5-5"/>
      </svg>
      <h4>Document Ready!</h4>
      <p>Your legal document has been generated successfully using professional templates.</p>
      
      <div class="doc-preview-container" style="margin: var(--space-4) 0; text-align: left;">
        <label style="font-size: 0.8125rem; color: var(--accent-gold); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: var(--space-2);">Document Preview (Scroll to view / Copy / Download)</label>
        <textarea class="form-group__textarea" style="width: 100%; min-height: 250px; font-family: var(--font-mono); font-size: 0.8125rem; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-glass); padding: var(--space-4); color: var(--text-primary); border-radius: var(--radius-sm); line-height: 1.5; resize: vertical;" readonly>${docText}</textarea>
      </div>
      
      <div style="display:flex; flex-direction:column; gap:var(--space-2); margin-top: var(--space-4); align-items:center;">
        <div style="display:flex; gap:var(--space-3); width: 100%; justify-content:center;">
          <button class="btn btn-primary doc-download-btn" type="button" style="flex:1;">
            📥 Download Plain Text (.txt)
          </button>
          <button class="btn btn-outline doc-download-pdf-btn" type="button" style="flex:1; border-color:var(--accent-gold); color:var(--accent-gold);">
            📄 Download PDF (with Watermark)
          </button>
        </div>
        <button class="btn btn-glass doc-copy-btn" type="button" style="width: 100%;">
          📋 Copy to Clipboard
        </button>
      </div>
    </div>
  `;

  // Reset submit button
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="sparkles" class="icon-sm"></i> Generate';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }, 1000);

  const dlBtn = progressEl.querySelector('.doc-download-btn');
  const dlPdfBtn = progressEl.querySelector('.doc-download-pdf-btn');
  const copyBtn = progressEl.querySelector('.doc-copy-btn');
  const textarea = progressEl.querySelector('textarea');

  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${docTitle.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      dlBtn.textContent = '✅ Plain Text Downloaded';
      dlBtn.disabled = true;
      dlBtn.classList.remove('btn-primary');
      dlBtn.classList.add('btn-glass');
    });
  }

  if (dlPdfBtn) {
    dlPdfBtn.addEventListener('click', () => {
      downloadPDFWithWatermark(docTitle, docText);
    });
  }

  if (copyBtn && textarea) {
    copyBtn.addEventListener('click', () => {
      textarea.select();
      document.execCommand('copy');
      
      copyBtn.innerHTML = '✅ Copied to Clipboard';
      copyBtn.disabled = true;
      setTimeout(() => {
        copyBtn.innerHTML = '📋 Copy to Clipboard';
        copyBtn.disabled = false;
      }, 2000);
    });
  }
}

/**
 * Downloads a beautifully formatted PDF page with an elegant diagonal watermark reading legalaidindia.org
 */
function downloadPDFWithWatermark(docTitle, docText) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  const formattedBody = docText
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<br>';
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith('==')) {
        return `<h2 style="font-family:'Playfair Display', serif; font-size: 1.25rem; color: #111; margin-top: 1.5rem; margin-bottom: 0.5rem; text-transform: uppercase;">${trimmed}</h2>`;
      }
      if (trimmed.startsWith('==')) {
        return '<hr style="border: 0; border-top: 1px dashed #ccc; margin: 1.5rem 0;">';
      }
      return `<p style="font-family:'Inter', sans-serif; font-size: 0.95rem; color: #333; line-height: 1.6; margin: 0.5rem 0; text-align: justify; text-justify: inter-word;">${trimmed}</p>`;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${docTitle}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4;
          margin: 25mm 20mm 25mm 20mm;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif;
          color: #333;
          background-color: #fff;
          position: relative;
        }
        .header {
          border-bottom: 2px solid #c8a951;
          padding-bottom: 0.5rem;
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-title {
          font-family: 'Playfair Display', serif;
          font-size: 0.875rem;
          color: #c8a951;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }
        .header-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: 700;
          color: #111;
        }
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          border-top: 1px solid #eee;
          padding-top: 0.5rem;
          font-size: 0.75rem;
          color: #888;
          display: flex;
          justify-content: space-between;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-35deg);
          font-family: 'Inter', sans-serif;
          font-size: 4rem;
          font-weight: 700;
          color: rgba(200, 169, 81, 0.06);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          white-space: nowrap;
          pointer-events: none;
          z-index: -1000;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .content {
          margin-bottom: 15mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .watermark {
            color: rgba(200, 169, 81, 0.07) !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="watermark">legalaidindia.org</div>
      
      <div class="header">
        <span class="header-logo">LegalAidIndia.org</span>
        <span class="header-title">Smart Draft Workspace</span>
      </div>
      
      <div class="content">
        ${formattedBody}
      </div>
      
      <div class="footer">
        <span>Generated via LegalAidIndia.org AI-Powered Document Tools</span>
        <span>Date: ${new Date().toLocaleDateString('en-IN')}</span>
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
}


/* -----------------------------------------------------------------------
   3. Case Search
   ----------------------------------------------------------------------- */

const SAMPLE_CASES = [
  {
    title: 'Kesavananda Bharati v. State of Kerala',
    citation: '(1973) 4 SCC 225',
    court: 'Supreme Court of India',
    year: 1973,
    summary: 'Established the Basic Structure Doctrine — Parliament cannot alter the basic structure of the Constitution.',
    tags: ['constitutional', 'basic structure', 'fundamental rights'],
  },
  {
    title: 'Vishaka v. State of Rajasthan',
    citation: '(1997) 6 SCC 241',
    court: 'Supreme Court of India',
    year: 1997,
    summary: 'Laid down guidelines against sexual harassment at the workplace, later codified as the POSH Act, 2013.',
    tags: ['women', 'harassment', 'workplace', 'posh'],
  },
  {
    title: 'Maneka Gandhi v. Union of India',
    citation: '(1978) 1 SCC 248',
    court: 'Supreme Court of India',
    year: 1978,
    summary: 'Expanded the scope of Article 21 — right to life includes right to live with dignity.',
    tags: ['fundamental rights', 'article 21', 'personal liberty'],
  },
  {
    title: 'Shah Bano v. Mohd. Ahmed Khan',
    citation: '1985 SCR (3) 844',
    court: 'Supreme Court of India',
    year: 1985,
    summary: 'Landmark case on maintenance rights of Muslim women under Section 125 CrPC.',
    tags: ['maintenance', 'divorce', 'muslim women', 'family law'],
  },
  {
    title: 'K.S. Puttaswamy v. Union of India',
    citation: '(2017) 10 SCC 1',
    court: 'Supreme Court of India',
    year: 2017,
    summary: 'Declared Right to Privacy as a fundamental right under Article 21 of the Constitution.',
    tags: ['privacy', 'fundamental rights', 'aadhaar', 'article 21'],
  },
  {
    title: 'Navtej Singh Johar v. Union of India',
    citation: '(2018) 10 SCC 1',
    court: 'Supreme Court of India',
    year: 2018,
    summary: 'Decriminalised consensual homosexual acts by reading down Section 377 IPC.',
    tags: ['section 377', 'lgbtq', 'equality', 'personal liberty'],
  },
  {
    title: 'Indian Young Lawyers Association v. State of Kerala',
    citation: '(2019) 11 SCC 1',
    court: 'Supreme Court of India',
    year: 2019,
    summary: 'Sabarimala case — held that the exclusion of women from the temple violated fundamental rights.',
    tags: ['women', 'religion', 'equality', 'sabarimala'],
  },
  {
    title: 'M.C. Mehta v. Union of India',
    citation: '(1987) 1 SCC 395',
    court: 'Supreme Court of India',
    year: 1987,
    summary: 'Oleum gas leak case — established the principle of absolute liability for hazardous industries.',
    tags: ['environment', 'absolute liability', 'industry', 'pollution'],
  },
];

let currentCaseDatabase = SAMPLE_CASES;

// Load real Indian legal cases extracted from Hugging Face dataset if available
fetch('js/cases_data.json')
  .then((res) => {
    if (res.ok) return res.json();
    throw new Error('Local dataset file not found');
  })
  .then((data) => {
    if (Array.isArray(data) && data.length > 0) {
      currentCaseDatabase = data;
      console.log(`Successfully loaded ${data.length} real Indian legal cases from Hugging Face datasets.`);
    }
  })
  .catch((err) => {
    console.warn('Dynamic case database file is offline or not generated yet. Using built-in landmark case precedents.', err);
  });

function initCaseSearch() {
  const searchInput = document.getElementById('case-search-input');
  const searchBtn = document.getElementById('case-search-btn');

  if (!searchInput) return;

  // Create results container dynamically below the search panel
  const searchPanel = searchInput.closest('.glass-panel');
  let resultsContainer = document.querySelector('.case-search-results');

  if (!resultsContainer && searchPanel) {
    resultsContainer = document.createElement('div');
    resultsContainer.className = 'case-search-results';
    searchPanel.parentNode.insertBefore(resultsContainer, searchPanel.nextSibling);
  }

  if (!resultsContainer) return;

  const doSearch = () => {
    const query = searchInput.value.trim().toLowerCase();

    if (query.length < 2) {
      resultsContainer.innerHTML = '';
      return;
    }

    const matches = currentCaseDatabase.filter((c) => {
      const haystack = `${c.title} ${c.summary} ${c.tags.join(' ')} ${c.citation}`.toLowerCase();
      return haystack.includes(query);
    });

    renderCaseResults(matches, resultsContainer, query);
  };

  // Debounced input search
  let debounceTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doSearch, 300);
  });

  // Button click search
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      doSearch();
    });
  }

  // Enter key
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  });
}

function renderCaseResults(cases, container, query) {
  if (!cases.length) {
    container.innerHTML = `
      <div class="case-no-results">
        <p>No cases found for "<strong>${escapeHtml(query)}</strong>". Try keywords like "privacy", "harassment", "property", or "constitutional".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:var(--space-4);">Found <strong style="color:var(--accent-gold);">${cases.length}</strong> matching case${cases.length > 1 ? 's' : ''}</p>
    ${cases.map((c) => `
      <div class="case-card">
        <div class="case-card__header">
          <h4 class="case-card__title">${highlightMatch(escapeHtml(c.title), query)}</h4>
          <span class="case-card__year">${c.year}</span>
        </div>
        <p class="case-card__citation">${escapeHtml(c.citation)} — ${escapeHtml(c.court)}</p>
        <p class="case-card__summary">${highlightMatch(escapeHtml(c.summary), query)}</p>
        <div class="case-card__tags">
          ${c.tags.map((t) => `<span class="case-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* -----------------------------------------------------------------------
   4. Lawyer Marketplace Filters
   ----------------------------------------------------------------------- */

function initLawyerFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const lawyerCards = document.querySelectorAll('.lawyer-card');

  if (!lawyerCards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter || 'all';

      // Update active button
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter cards by data-category
      let visibleCount = 0;
      lawyerCards.forEach((card) => {
        const category = card.dataset.category || '';
        const shouldShow = filter === 'all' || category === filter;

        card.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
      });

      // Show "no results" if needed
      const grid = document.querySelector('.lawyers-grid');
      if (grid) {
        let noResults = grid.querySelector('.lawyer-no-results');
        if (visibleCount === 0) {
          if (!noResults) {
            noResults = document.createElement('p');
            noResults.className = 'lawyer-no-results';
            noResults.textContent = 'No lawyers found in this category. Try "All" to see everyone.';
            grid.appendChild(noResults);
          }
        } else if (noResults) {
          noResults.remove();
        }
      }
    });
  });
}

/* -----------------------------------------------------------------------
   5. Service Card Click Interaction
   ----------------------------------------------------------------------- */

function initServiceCardInteractions() {
  const serviceCards = document.querySelectorAll('.service-card');
  if (!serviceCards.length) return;

  serviceCards.forEach((card) => {
    card.addEventListener('mousedown', () => {
      card.style.transform = 'scale(0.97)';
    });

    card.addEventListener('mouseup', () => {
      card.style.transform = '';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });

    card.addEventListener('click', (e) => {
      const link = card.querySelector('a');
      if (link && !e.target.closest('a')) {
        link.click();
        return;
      }

      card.classList.add('service-card--clicked');
      setTimeout(() => card.classList.remove('service-card--clicked'), 400);
    });

    if (!card.getAttribute('tabindex')) {
      card.setAttribute('tabindex', '0');
    }

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

/* -----------------------------------------------------------------------
   6. Master Library Search and Load
   ----------------------------------------------------------------------- */

let libraryIndex = null;

function initLibraryTab() {
  const catSelect = document.getElementById('library-cat-select');
  const docList = document.getElementById('library-doc-list');
  const searchInput = document.getElementById('library-search-input');
  const workspacePanel = document.getElementById('library-workspace-panel');

  if (!catSelect || !docList || !workspacePanel) return;

  // Cache compiled templates index
  let libraryIndex = null;

  // Load the master drafts index compiled from user's drafts
  fetch('js/drafts_index.json')
    .then((res) => {
      if (res.ok) return res.json();
      throw new Error('drafts_index.json not found');
    })
    .then((data) => {
      libraryIndex = data;
      populateCategories();
      console.log(`Successfully loaded master legal drafts catalog containing 1,839 templates.`);
    })
    .catch((err) => {
      console.warn('Could not load master drafts index file.', err);
    });

  // Populate categories select dropdown
  function populateCategories() {
    if (!libraryIndex || !libraryIndex.categories) return;

    // Clear previous options except placeholder
    catSelect.innerHTML = '<option value="">Select Category (52 available)</option>';

    const sortedCats = Object.keys(libraryIndex.categories).sort();
    sortedCats.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = `${cat} (${libraryIndex.categories[cat].length} drafts)`;
      catSelect.appendChild(opt);
    });
  }

  // Helper to render templates inside the #library-doc-list sidebar element
  function renderTemplatesList(templates, activePath = null) {
    if (templates.length === 0) {
      docList.innerHTML = `
        <div style="padding: var(--space-4); color: var(--text-muted); font-size: 0.8125rem; text-align: center;">
          No templates found.
        </div>
      `;
      return;
    }

    docList.innerHTML = templates.map((doc) => {
      const isActive = doc.path === activePath ? ' active' : '';
      return `
        <div class="library-doc-item${isActive}" data-path="${doc.path}" data-name="${escapeHtml(doc.name)}">
          ${escapeHtml(doc.name)}
        </div>
      `;
    }).join('');

    // Attach click listeners to rows
    const items = docList.querySelectorAll('.library-doc-item');
    items.forEach((item) => {
      item.addEventListener('click', () => {
        // Toggle active row styling
        items.forEach((it) => it.classList.remove('active'));
        item.classList.add('active');

        // Load preview in workspace
        loadTemplatePreview(item.dataset.path, item.dataset.name);
      });
    });
  }

  // Handle category selection change
  catSelect.addEventListener('change', () => {
    const selectedCat = catSelect.value;
    if (!selectedCat) {
      docList.innerHTML = `
        <div style="padding: var(--space-4); color: var(--text-muted); font-size: 0.8125rem; text-align: center;">
          Select a category or search to view templates.
        </div>
      `;
      return;
    }

    if (!libraryIndex || !libraryIndex.categories[selectedCat]) return;

    const docs = libraryIndex.categories[selectedCat];
    renderTemplatesList(docs);
  });

  // Quick category chip listener
  const quickChips = document.querySelectorAll('.library-quick-chip');
  quickChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const cat = chip.dataset.cat;
      if (catSelect) {
        catSelect.value = cat;
        // Trigger select change event
        const event = new Event('change');
        catSelect.dispatchEvent(event);
      }
    });
  });

  // Debounced input search across all categories
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(performLibrarySearch, 250);
  });

  function performLibrarySearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length < 2) {
      // Restore templates list of current selected category if search is cleared
      if (catSelect.value) {
        const event = new Event('change');
        catSelect.dispatchEvent(event);
      } else {
        docList.innerHTML = `
          <div style="padding: var(--space-4); color: var(--text-muted); font-size: 0.8125rem; text-align: center;">
            Select a category or search to view templates.
          </div>
        `;
      }
      return;
    }

    if (!libraryIndex || !libraryIndex.categories) return;

    const matches = [];
    Object.keys(libraryIndex.categories).forEach((cat) => {
      libraryIndex.categories[cat].forEach((doc) => {
        if (doc.name.toLowerCase().includes(query) || cat.toLowerCase().includes(query)) {
          matches.push({
            name: doc.name,
            path: doc.path,
            category: cat
          });
        }
      });
    });

    renderTemplatesList(matches);
  }

  function loadTemplatePreview(path, title) {
    // Clear old result or show loading indicator in workspace panel
    workspacePanel.innerHTML = `
      <div style="text-align: center; padding: var(--space-8); height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <span class="pulse-animation" style="font-size: 1.5rem; display: block; margin-bottom: var(--space-4);">⏳</span>
        <p style="color:var(--text-secondary);">Retrieving and formatting your template text…</p>
      </div>
    `;

    fetch(path)
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error('Template text file could not be read');
      })
      .then((text) => {
        renderTemplatePreview(workspacePanel, title, text);
      })
      .catch((err) => {
        workspacePanel.innerHTML = `
          <div style="text-align: center; padding: var(--space-6); color: var(--error); height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto var(--space-4);">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h4>Error Loading Template</h4>
            <p>${err.message}. Please verify the templates folder path is correct.</p>
          </div>
        `;
      });
  }

  function renderTemplatePreview(container, title, text) {
    container.innerHTML = `
      <div class="doc-success" style="padding: 0; text-align: left; height: 100%; display: flex; flex-direction: column;">
        <h4 style="color: var(--accent-gold); font-size: 1.125rem; font-family: var(--font-heading); margin-bottom: var(--space-1);">${title}</h4>
        <p style="color: var(--text-muted); font-size: 0.8125rem; margin-bottom: var(--space-4);">Double-click to select all text, or use the buttons below to copy or download.</p>
        
        <div class="doc-preview-container" style="flex-grow: 1; display: flex; flex-direction: column; margin-bottom: var(--space-4); min-height: 250px;">
          <textarea class="form-group__textarea" style="width: 100%; flex-grow: 1; min-height: 280px; font-family: var(--font-mono); font-size: 0.8125rem; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-glass); padding: var(--space-4); color: var(--text-primary); border-radius: var(--radius-sm); line-height: 1.6; resize: vertical;" readonly>${text}</textarea>
        </div>
        
        <div style="display:flex; gap:var(--space-3); justify-content: flex-start; flex-shrink: 0;">
          <button class="btn btn-primary doc-dl-btn" type="button" style="font-size:0.8125rem; padding: var(--space-2) var(--space-4);">
            📥 Download Template (.txt)
          </button>
          <button class="btn btn-outline doc-copy-btn" type="button" style="font-size:0.8125rem; padding: var(--space-2) var(--space-4);">
            📋 Copy Template Text
          </button>
        </div>
      </div>
    `;

    const dlBtn = container.querySelector('.doc-dl-btn');
    const copyBtn = container.querySelector('.doc-copy-btn');
    const textarea = container.querySelector('textarea');

    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        dlBtn.textContent = '✅ Template Downloaded';
        dlBtn.disabled = true;
        dlBtn.classList.remove('btn-primary');
        dlBtn.classList.add('btn-glass');
      });
    }

    if (copyBtn && textarea) {
      copyBtn.addEventListener('click', () => {
        textarea.select();
        document.execCommand('copy');
        
        copyBtn.textContent = '✅ Copied to Clipboard';
        copyBtn.disabled = true;
        setTimeout(() => {
          copyBtn.textContent = '📋 Copy Template Text';
          copyBtn.disabled = false;
        }, 2000);
      });
    }
  }
}
