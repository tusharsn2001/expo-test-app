import React, { useState, useMemo } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';

export default function App() {
  const [pasteText, setPasteText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [inTest, setInTest] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showReview, setShowReview] = useState(false);

  /**
   * Custom button component for consistent styling.
   * @param {object} props
   * @param {string} props.title - The text to display on the button.
   * @param {Function} props.onPress - The function to call when the button is pressed.
   * @param {boolean} [props.disabled=false] - Whether the button is disabled.
   * @param {object} [props.style] - Custom styles for the button.
   */
  const CustomButton = ({ title, onPress, disabled = false, style = {} }) => (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{title}</Text>
    </TouchableOpacity>
  );

  /**
   * Parses raw text into an array of MCQ objects.
   * The parser is tolerant to various formats, including:
   * - Questions separated by one or more blank lines.
   * - Answers explicitly stated with "Answer: A" or similar.
   * - Answers marked with a '*' at the beginning of the correct option.
   */
  function parseMCQs(text) {
    // Normalize line endings and split into question blocks by 2 or more newlines
    const normalized = text.replace(/\r/g, '').trim();
    const blocks = normalized.split(/\n{2,}/).filter(Boolean);

    const parsedQuestions = [];

    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return; // A question needs at least a question line and one option line

      let questionText = '';
      const options = [];
      let answerIndex = -1;
      let tempAnswerLine = null;

      // Find the answer line first and store it separately
      const answerLineIndex = lines.findIndex(l => /^(Answer|Ans)[:\s-]/i.test(l));
      if (answerLineIndex !== -1) {
        tempAnswerLine = lines[answerLineIndex];
        // Remove the answer line from the lines array to prevent it from being parsed as an option
        lines.splice(answerLineIndex, 1);
      }

      // Determine the question and options
      let firstOptionIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        // Regex to find options labeled with A., A), 1., 1) or an asterisk
        if (/^([A-D]|[1-4])[\s\.\)]|^[\*]/.test(lines[i].trim())) {
          firstOptionIndex = i;
          break;
        }
      }

      if (firstOptionIndex === -1) {
        // Fallback: Assume the first line is the question, the rest are options
        questionText = lines[0] || '';
        for (let i = 1; i < lines.length; i++) {
          options.push(lines[i].trim());
        }
      } else {
        // Normal case: Question is the text before the first option
        questionText = lines.slice(0, firstOptionIndex).join(' ').trim();
        for (let i = firstOptionIndex; i < lines.length; i++) {
          let optionText = lines[i].trim();
          
          // Check for an inline asterisk marking the correct answer
          if (optionText.startsWith('*')) {
            answerIndex = options.length;
            optionText = optionText.substring(1).trim(); // Remove the asterisk
          }
          // Clean up option labels like A., 1)
          optionText = optionText.replace(/^([A-D]|[1-4])[\s\.\)]/, '').trim();
          options.push(optionText);
        }
      }

      // Process the explicit answer line if found
      if (tempAnswerLine) {
        const answerMatch = tempAnswerLine.match(/([A-D]|[1-4])/i);
        if (answerMatch) {
          const val = answerMatch[1].toUpperCase();
          if (/[A-D]/.test(val)) {
            answerIndex = val.charCodeAt(0) - 'A'.charCodeAt(0);
          } else {
            answerIndex = parseInt(val, 10) - 1;
          }
        }
      }

      // Push the parsed question if it's valid
      if (questionText && options.length > 0) {
        parsedQuestions.push({ question: questionText, options: options, answerIndex });
      }
    });

    return parsedQuestions;
  }

  function handleParse() {
    if (!pasteText.trim()) {
      Alert.alert('Paste text first', 'Please paste MCQs into the text box.');
      return;
    }
    const parsed = parseMCQs(pasteText);
    if (parsed.length === 0) {
      Alert.alert('No questions found', 'The parser did not find any question blocks. Make sure questions and options are separated by a blank line.');
      return;
    }

    const withoutAnswer = parsed.filter(p => p.answerIndex === -1).length;
    setQuestions(parsed);

    if (withoutAnswer > 0) {
      Alert.alert(
        'Parsed with warnings',
        `${parsed.length} questions parsed. ${withoutAnswer} question(s) had no detected correct answer and will be excluded from the test.`
      );
    } else {
      Alert.alert(
        'Parsed',
        `${parsed.length} questions parsed.`
      );
    }
  }

  function startTest() {
    const valid = questions.filter(q => q.answerIndex >= 0);
    if (valid.length === 0) {
      Alert.alert('No valid questions', 'No parsed questions with detectable answers. Please include answers (e.g., "Answer: A") or mark the correct option with a "*".');
      return;
    }
    setQuestions(valid);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setInTest(true);
    setShowReview(false);
  }

  function selectOption(idx) {
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: idx }));
  }

  function goNext() {
    if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1);
  }

  function goPrev() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }

  function finishTest() {
    setInTest(false);
    setShowReview(true);
  }

  const score = useMemo(() => {
    if (!showReview) return null;
    let correct = 0;
    questions.forEach((q, i) => {
      const sel = selectedAnswers[i];
      if (typeof sel !== 'undefined' && sel === q.answerIndex) correct++;
    });
    return { correct, total: questions.length, percent: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0 };
  }, [showReview, questions, selectedAnswers]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps='handled'>
        <Text style={styles.title}>MCQ Practice — Offline Android</Text>

        {!inTest && !showReview && (
          <View style={styles.box}>
            <Text style={styles.subtitle}>Paste MCQs</Text>
            <TextInput
              value={pasteText}
              onChangeText={setPasteText}
              multiline
              placeholder={'Paste questions here. Separate questions by a blank line. Use "Answer: A" or mark the correct option with a "*".'}
              style={styles.input}
            />
            <CustomButton title='Parse & Preview' onPress={handleParse} />

            {questions.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.subtitle}>Parsed Questions ({questions.length})</Text>
                {questions.map((q, i) => (
                  <View key={i} style={styles.questionCard}>
                    <Text style={styles.qText}>{i + 1}. {q.question}</Text>
                    {q.options.map((op, j) => (
                      <Text key={j} style={styles.optionText}>{String.fromCharCode(65 + j)}. {op}</Text>
                    ))}
                    <Text style={styles.answerText}>Detected Answer: {q.answerIndex >= 0 ? String.fromCharCode(65 + q.answerIndex) : '—'}</Text>
                  </View>
                ))}
                <View style={{ marginTop: 12 }}>
                  <CustomButton title='Start Mock Test' onPress={startTest} />
                </View>
              </View>
            )}
          </View>
        )}

        {inTest && (
          <View style={styles.box}>
            <Text style={styles.subtitle}>Question {currentIndex + 1} / {questions.length}</Text>
            <Text style={styles.qMain}>{questions[currentIndex].question}</Text>
            {questions[currentIndex].options.map((op, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionButton,
                  selectedAnswers[currentIndex] === idx && styles.optionSelected,
                ]}
                onPress={() => selectOption(idx)}
              >
                <Text style={styles.optionButtonText}>{String.fromCharCode(65 + idx)}. {op}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.navRow}>
              <CustomButton title='Prev' onPress={goPrev} disabled={currentIndex === 0} style={{ flex: 1, marginRight: 8 }} />
              {currentIndex < questions.length - 1 ? (
                <CustomButton title='Next' onPress={goNext} style={{ flex: 1, marginLeft: 8 }} />
              ) : (
                <CustomButton title='Finish' onPress={finishTest} style={{ flex: 1, marginLeft: 8 }} />
              )}
            </View>
          </View>
        )}

        {showReview && (
          <View style={styles.box}>
            <Text style={styles.subtitle}>Score</Text>
            <Text style={styles.scoreText}>
              {score.correct} / {score.total} ({score.percent}%)
            </Text>
            <Text style={{ marginTop: 8, fontWeight: '600' }}>Review</Text>
            {questions.map((q, i) => {
              const sel = selectedAnswers[i];
              const correctIdx = q.answerIndex;
              return (
                <View key={i} style={styles.questionCard}>
                  <Text style={styles.qText}>
                    {i + 1}. {q.question}
                  </Text>
                  {q.options.map((op, j) => {
                    const isSel = sel === j;
                    const isCorrect = correctIdx === j;
                    return (
                      <Text
                        key={j}
                        style={[
                          styles.optionText,
                          isCorrect && styles.correctOption,
                          isSel && !isCorrect && styles.wrongOption,
                        ]}
                      >
                        {String.fromCharCode(65 + j)}. {op} {isCorrect ? ' ✓' : ''}{isSel && !isCorrect ? ' ✗' : ''}
                      </Text>
                    );
                  })}
                </View>
              );
            })}
            <View style={{ marginTop: 12 }}>
              <CustomButton
                title='Back to Import'
                onPress={() => {
                  setShowReview(false);
                  setQuestions([]);
                  setPasteText('');
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scroll: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  box: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  input: {
    minHeight: 120,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#6b7280',
  },
  questionCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
  },
  optionText: {
    marginLeft: 12,
    marginTop: 4,
    fontSize: 15,
    color: '#374151',
  },
  answerText: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#4b5563',
    fontSize: 14,
  },
  qMain: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  optionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 8,
    backgroundColor: '#ffffff',
  },
  optionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#60a5fa',
  },
  optionButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 12,
  },
  correctOption: {
    color: 'green',
    fontWeight: '700',
  },
  wrongOption: {
    color: 'red',
  },
});
