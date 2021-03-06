import { html, svg, css } from "lit-element";
import EditorElement from "../base/editor-element/editor-element";

const iconLink = svg`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <path d="M7.8 24c0-3.42 2.78-6.2 6.2-6.2h8V14h-8C8.48 14 4 18.48 4 24s4.48 10 10 10h8v-3.8h-8c-3.42 0-6.2-2.78-6.2-6.2zm8.2 2h16v-4H16v4zm18-12h-8v3.8h8c3.42 0 6.2 2.78 6.2 6.2s-2.78 6.2-6.2 6.2h-8V34h8c5.52 0 10-4.48 10-10s-4.48-10-10-10z"/>
</svg>
`;

export default class Button extends EditorElement {
  static get properties() {
    return {
      target: { type: String, attribute: "link-target" },
      error: Boolean
    };
  }

  hasError() {
    return this.error;
  }

  validate() {
    const hadError = this.error;

    const target = this.target && !!this.target.toString().trim().length;
    const innerText = !!this.innerText.trim().length;
    // @todo: should we validate target to be a valid URL/fragment.
    this.error = !((target && innerText) || (!target && !innerText));
    if (!hadError && this.error) {
      this.emitElementValidationErrorEvent(
        "You must provide a link target and a link text or leave both empty."
      );
    } else if (hadError && !this.error) {
      this.emitElementValidationErrorResolvedEvent();
    }
  }

  setupMutationObserver() {
    /* global MutationObserver */
    this.observer = new MutationObserver(this.validate.bind(this));
    this.observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupMutationObserver();

    // Textfield errors immediately highlighted
    this.requestInformation("show-errors", {}, showErrors => {
      if (showErrors) {
        this.validate();
      }
    });
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  updated(properties) {
    if (properties.has("target")) {
      this.validate();
    }
  }

  render() {
    return html`
      <div
        class="button ${this.target ? "linked" : "not-linked"} ${this.error
          ? "error"
          : ""}"
      >
        <div class="button__content">
          <slot></slot>
        </div>
        <button @click="${this.inEditor ? this.selectLink : () => {}}">
          ${iconLink}
        </button>
      </div>
    `;
  }

  selectLink() {
    const attributes = {};
    Object.keys(this.attributes).forEach(key => {
      if (this.hasAttribute(this.attributes[key].name)) {
        attributes[this.attributes[key].name] = this.attributes[key].value;
      }
    });

    this.requestInformation("select-link", attributes, link => {
      if (link.href !== null) {
        this.modifyDocument(editor => {
          const linkAttributes = link;
          linkAttributes["link-target"] = link.href;
          editor.attributes(this, linkAttributes);
        });
      } else {
        this.modifyDocument(editor =>
          editor.removeAttribute(this, "link-target")
        );
      }
    });
  }
}

Button.styles = css`
  :host {
    display: inline-block;
    --icon-size: 2em;
    --icon-color: black;
    --icon-position: relative;
    --icon-left: auto;
    --icon-top: auto;
    --color-red: #d32323;
    --button-background-color: #ffbb15;
    --button-border-radius: 3em;
    --button-border-color: transparent;
  }

  .button {
    display: flex;
    align-items: center;
    font-weight: bold;
    background: var(--button-background-color);
    border: 1px solid var(--button-border-color);
    border-radius: var(--button-border-radius);
    padding: 0 1em;
  }

  .button__content {
    width: 100%;
  }

  .button button {
    width: var(--icon-size);
    border: none;
    padding: 0;
    background: none;
    flex-grow: 0;
    cursor: pointer;
    transition: transform 0.5s ease;
    outline: none;
    margin-left: 0.5em;
    position: var(--icon-position);
    left: var(--icon-left);
    top: var(--icon-top);
  }

  .button svg {
    width: var(--icon-size);
    padding: 0;
    display: block;
    fill: var(--icon-color);
  }

  .button.not-linked svg {
    opacity: 0.5;
  }

  .button.error {
    box-shadow: 0 0 0 5px var(--color-red);
  }
`;
