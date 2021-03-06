import { LitElement, html, css } from "lit-element";
import styles from "!raw-loader!./textfield.css";
import EditorElement from "../base/editor-element/editor-element";

export default class TextField extends EditorElement {
  static get properties() {
    return {
      pattern: { attribute: "ck-pattern", type: String },
      hasPatternError: { type: Boolean },
      errorMessage: { attribute: "ck-error-message", type: String },
      minLength: { attribute: "ck-min", type: Number },
      maxLength: { attribute: "ck-max", type: Number },
      hasLengthError: { type: Boolean },
      hasHelper: { type: Boolean },
      helper: { attribute: "ck-message-helper", type: String }
    };
  }

  hasError() {
    return this.hasLengthError || this.hasPatternError;
  }

  connectedCallback() {
    super.connectedCallback();

    this.querySelectorAll(["[contenteditable]"]).forEach(el => {
      /* global MutationObserver */
      const observer = new MutationObserver(this.validate.bind(this));
      observer.observe(el, {
        childList: true,
        subtree: true,
        characterData: true
      });

      el.addEventListener("focus", this.setHelper.bind(this));
      el.addEventListener("blur", () => {
        this.validate();
        this.hasHelper = false;
      });

      el.addEventListener("input", this.validate.bind(this));
    });

    // Textfield errors immediately highlighted
    this.requestInformation("show-errors", {}, showErrors => {
      if (showErrors) {
        this.validate();
      }
    });
  }

  validate() {
    const hadPatternError = this.hasPatternError;
    const hadLengthError = this.hasLengthError;

    // MAX
    if (this.maxLength) {
      this.maxValidation();
    }
    // MIN
    if (this.minLength) {
      this.minValidation();
    }
    // Range
    if (this.maxLength && this.minLength) {
      this.rangeValidation();
    }
    // Pattern
    if (this.pattern) {
      this.patternValidation();
    }

    // Adjust message of the helper.
    if (this.maxLength && !this.minLength) {
      this.helper = `${this.maxLength -
        this.innerText.length} letters remaining.`;
      this.setHelper();
    }

    if (!hadPatternError && this.hasPatternError) {
      this.emitElementValidationErrorEvent(this.errorMessage, "pattern_error");
    } else if (hadPatternError && !this.hasPatternError) {
      this.emitElementValidationErrorResolvedEvent();
    }

    if (!hadLengthError && this.hasLengthError) {
      this.emitElementValidationErrorEvent(this.errorMessage, "length_error");
    } else if (hadLengthError && !this.hasLengthError) {
      this.emitElementValidationErrorResolvedEvent();
    }
  }

  /**
   * The ck-* attributes are not applied immediately, so we have to watch for updates and re-validate.
   * @param properties
   */
  updated(properties) {
    if (
      !(
        properties.has("minLength") ||
        properties.has("maxLength") ||
        properties.has("pattern")
      )
    ) {
      return;
    }
    // Textfield errors immediately highlighted
    this.requestInformation("show-errors", {}, showErrors => {
      if (showErrors) {
        this.validate();
      }
    });
  }

  maxValidation() {
    if (this.innerText.length > this.maxLength && !this.minLength) {
      if (!this.errorMessage) {
        this.errorMessage = `Please enter no more than
          ${this.maxLength} letters.`;
      }
      this.hasLengthError = true;
    } else {
      this.hasLengthError = false;
    }
    this.setHelper();
  }

  minValidation() {
    if (this.getInnerText().length < this.minLength) {
      if (!this.errorMessage) {
        this.errorMessage = `Please enter at least
          ${this.minLength} letters.`;
      }
      this.hasLengthError = true;
    } else {
      this.hasLengthError = false;
    }
  }

  rangeValidation() {
    if (
      this.innerText.length > this.minLength &&
      this.innerText.length < this.maxLength
    ) {
      this.hasLengthError = false;
    } else {
      if (!this.errorMessage) {
        this.errorMessage = `Please enter ${this.minLength} to ${
          this.maxLength
        } letters.`;
      }
      this.hasLengthError = true;
    }
  }

  patternValidation() {
    const pattern = new RegExp(this.pattern);
    if (pattern.test(this.innerText)) {
      this.hasPatternError = false;
    } else {
      this.hasPatternError = true;
    }
  }

  setHelper() {
    if (this.helper) {
      if (!this.hasPatternError && !this.hasLengthError) {
        this.hasHelper = true;
      } else {
        this.hasHelper = false;
      }
    }
  }

  getInnerText() {
    // Remove whitespace.
    return this.innerText.replace(/[\n\r]+|[\s]{2,}/g, "");
  }

  render() {
    return html`
      <style>
        ${styles}
      </style>

      <div
        class="ck-textfield ${this.hasPatternError || this.hasLengthError
          ? "error"
          : ""}"
      >
        ${this.hasHelper
          ? html`
              <div class="ck-tooltip ck-tooltip--helper">${this.helper}</div>
            `
          : null}
        ${this.hasLengthError
          ? html`
              <div class="ck-tooltip ck-tooltip--error">
                ${this.errorMessage ? this.errorMessage : "Length error"}
              </div>
            `
          : null}
        ${this.hasPatternError
          ? html`
              <div class="ck-tooltip ck-tooltip--error">
                ${this.errorMessage ? this.errorMessage : "Pattern error"}
              </div>
            `
          : null}
        <div
          class="${this.hasPatternError || this.hasLengthError
            ? "is-valid"
            : "is-invalid"}"
        >
          <slot></slot>
        </div>
      </div>
    `;
  }
}

// Static flag if textfield errors should be highlighted immediately.
// If set to false, errors are highlighted after focus is lost for the first time.
TextField.initializeWithErrors = false;
