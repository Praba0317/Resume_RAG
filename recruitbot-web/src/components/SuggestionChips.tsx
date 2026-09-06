const suggestions = ['Senior QA architect', 'Python ML engineer', 'Java backend developer', 'Lead QA engineer']

interface SuggestionChipsProps { onSelect: (query: string) => void }

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return <div className="suggestion-row" aria-label="Suggested searches">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => onSelect(suggestion)}>{suggestion}</button>)}</div>
}
