from typing import List, Optional
import numpy as np
import networkx as nx
from sentence_transformers import SentenceTransformer
_SENTENCE_MODEL_NAME= "sentence-transformers/all-MiniLM-L6-v2"
_sentence_model: Optional[SentenceTransformer]= None
def get_sentence_model()-> SentenceTransformer:
  # laxily loading the sentence transformer model once
  global _sentence_model
  if _sentence_model is None:
    _sentence_model= SentenceTransformer(_SENTENCE_MODEL_NAME)
  return _sentence_model
def simple_sentence_split(text: str)-> List[str]:
  # simple sentence splitter based on periods. avoids external dependencies.
  #another approach could be to use nltk.sent_tokenize or spacy, not doing it simply cause of extra dependencies. why are extra deps bad? well they cause version conflicts sometimes.
  import re
  text= " ".join(text.split()) #this is for whitespace normalization
  pieces= re.split(r"(?<=[.!?])\s+", text)
  sentences= [p.strip() for p in pieces if len(p.strip()) > 20]
  return sentences
def textrank_summarize(
    transcript: str,
    max_sentences: int= 40,
)-> List[str]:
  # stage A approach: extract ~N most important sentecnes using TextRank over MiniLM sentence embeddings. Returns sentences in original order.
  sentences= simple_sentence_split(transcript)


  if not sentences:
    return []


  if len(sentences) <= max_sentences:
    return sentences
  
  model= get_sentence_model()
  embeddings= model.encode(sentences, convert_to_numpy= True)


  #cosine similarity aka dot product of normalized vectors
  norm = np.linalg.norm(embeddings, axis=1, keepdims= True) + 1e-8
  normed= embeddings/norm
  sim_matrix= np.dot(normed, normed.T)


  #removing self similarity- this is when i == j

  np.fill_diagonal(sim_matrix, 0.0)

  #build graph and run pagerank
  nx_graph= nx.from_numpy_array(sim_matrix)
  scores= nx.pagerank(nx_graph, max_iter=100, tol= 1e-4)
  ranked_indices= sorted(scores.keys(), key= lambda i: scores[i], reverse= True)

  #picking top N indices whilst mantaining original order
  top_indices= sorted(ranked_indices[:max_sentences])
  summary_sentences= [sentences[i] for i in top_indices]
  return summary_sentences