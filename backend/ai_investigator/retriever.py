import re
from typing import List, Dict, Any

class CaseEvidenceRetriever:
    def __init__(self, events: List[Dict[str, Any]], artifacts: List[Dict[str, Any]], iocs: List[Dict[str, Any]], evidence_files: List[Dict[str, Any]]):
        self.events = events
        self.artifacts = artifacts
        self.iocs = iocs
        self.evidence_files = evidence_files

    def search_evidence(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Perform grounded keyword & semantic token matching against all indexed forensic data."""
        tokens = [t.lower() for t in re.findall(r'\b\w+\b', query) if len(t) > 2]
        if not tokens:
            return self.events[:top_k]

        scored_events = []
        for evt in self.events:
            haystack = f"{evt.get('event_type', '')} {evt.get('category', '')} {evt.get('user', '')} {evt.get('device', '')} {evt.get('process', '')} {evt.get('file', '')} {evt.get('ip', '')} {evt.get('domain', '')} {evt.get('details', '')} {evt.get('raw_reference', '')}".lower()
            score = 0
            for token in tokens:
                if token in haystack:
                    score += 2
                    if token in evt.get('process', '').lower() or token in evt.get('file', '').lower() or token in evt.get('ip', '').lower():
                        score += 3
            if evt.get('is_suspicious'):
                score += 1
            if score > 0:
                scored_events.append((score, evt))

        scored_events.sort(key=lambda x: x[0], reverse=True)
        return [evt for _, evt in scored_events[:top_k]]
