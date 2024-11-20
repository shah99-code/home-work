import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import wordnet
import spacy

# Load SpaCy model
nlp = spacy.load('en_core_web_sm')

# Download NLTK data
nltk.download('averaged_perceptron_tagger')
nltk.download('wordnet')
nltk.download('punkt')

def detect_tense_nltk(sentence):
    tokens = word_tokenize(sentence)
    pos_tags = nltk.pos_tag(tokens)
    
    tense = []
    for word, tag in pos_tags:
        if tag in ['VBD', 'VBN']:  # Past tense verbs
            tense.append('Past')
        elif tag in ['VBG', 'VBP', 'VBZ']:  # Present tense verbs
            tense.append('Present')
        elif tag in ['MD']:  # Modal verbs for future tense
            tense.append('Future')
    
    return ' '.join(set(tense)) if tense else 'Unknown'

def detect_tense_spacy(sentence):
    doc = nlp(sentence)
    tense = []
    
    for token in doc:
        if token.tag_ in ['VBD', 'VBN']:  # Past tense verbs
            tense.append('Past')
        elif token.tag_ in ['VBG', 'VBP', 'VBZ']:  # Present tense verbs
            tense.append('Present')
        elif token.tag_ in ['MD']:  # Modal verbs for future tense
            tense.append('Future')
    
    return ' '.join(set(tense)) if tense else 'Unknown'

def detect_tense(sentence):
    nltk_result = detect_tense_nltk(sentence)
    spacy_result = detect_tense_spacy(sentence)
    
    # Combine results for a more comprehensive detection
    if 'Future' in nltk_result or 'Future' in spacy_result:
        return 'Future'
    elif 'Past' in nltk_result or 'Past' in spacy_result:
        return 'Past'
    elif 'Present' in nltk_result or 'Present' in spacy_result:
        return 'Present'
    else:
        return 'Unknown'

if __name__ == "__main__":
    sentences = [
        "By the time the new software is launched next year, the developers will have been working tirelessly.",
        "She has been studying all night.",
        "I will go to the store tomorrow.",
        "They had finished the project before the deadline."
    ]
    
    for sentence in sentences:
        print(f"Sentence: {sentence}")
        print(f"Tense: {detect_tense(sentence)}\n")
