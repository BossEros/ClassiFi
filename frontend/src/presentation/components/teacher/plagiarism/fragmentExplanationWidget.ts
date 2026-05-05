import * as monaco from "monaco-editor"
import { formatFragmentExplanationSentence } from "./fragmentExplanationHover"

export interface FragmentExplanationWidgetContent {
  label: string
  reasons: string[]
}

interface ShowFragmentExplanationWidgetInput {
  explanation: FragmentExplanationWidgetContent
  lineNumber: number
  column: number
}

/**
 * Shows fragment explanation labels as lightweight Monaco content widgets.
 */
export class FragmentExplanationWidget {
  private readonly domNode: HTMLDivElement
  private readonly editor: monaco.editor.IStandaloneCodeEditor
  private readonly widgetId: string
  private currentPosition: monaco.IPosition | null = null
  private isMounted = false

  constructor(
    editor: monaco.editor.IStandaloneCodeEditor,
    widgetId: string,
  ) {
    this.editor = editor
    this.widgetId = widgetId
    this.domNode = document.createElement("div")
    this.domNode.className = "classifi-fragment-explanation-widget"
    this.domNode.setAttribute("role", "tooltip")
    this.domNode.setAttribute("aria-label", "Editor fragment explanation")
  }

  getId(): string {
    return this.widgetId
  }

  getDomNode(): HTMLElement {
    return this.domNode
  }

  getPosition(): monaco.editor.IContentWidgetPosition | null {
    if (!this.currentPosition) return null

    return {
      position: this.currentPosition,
      preference: [
        monaco.editor.ContentWidgetPositionPreference.ABOVE,
        monaco.editor.ContentWidgetPositionPreference.BELOW,
      ],
    }
  }

  show(input: ShowFragmentExplanationWidgetInput): void {
    this.currentPosition = {
      lineNumber: input.lineNumber,
      column: Math.max(1, input.column),
    }
    this.render(input.explanation)

    if (!this.isMounted) {
      this.editor.addContentWidget(this)
      this.isMounted = true
    }

    this.editor.layoutContentWidget(this)
  }

  hide(): void {
    if (!this.isMounted) return

    this.editor.removeContentWidget(this)
    this.isMounted = false
    this.currentPosition = null
  }

  dispose(): void {
    this.hide()
  }

  private render(explanation: FragmentExplanationWidgetContent): void {
    this.domNode.replaceChildren()

    const labelElement = document.createElement("div")
    labelElement.className = "classifi-fragment-explanation-widget__label"
    labelElement.textContent = explanation.label
    this.domNode.appendChild(labelElement)

    const reasonSentence = formatFragmentExplanationSentence(explanation)
    if (!reasonSentence) return

    const reasonElement = document.createElement("div")
    reasonElement.className = "classifi-fragment-explanation-widget__reason"
    reasonElement.textContent = reasonSentence
    this.domNode.appendChild(reasonElement)
  }
}
