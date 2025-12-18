import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { recommendDebateTopics, type DebateTopic } from '../../../shared/api/debate-api';
import styles from './DiscussionPanel.module.css';

const DiscussionPanel: React.FC = () => {
  const [discussions, setDiscussions] = useState<any[]>(() => {
    const saved = localStorage.getItem('discussions');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();


  const [keyword, setKeyword] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('10'); // Default 10 mins
  const [maxParticipants, setMaxParticipants] = useState<string>('');

  const [showCreateModal, setShowCreateModal] = useState(false);

  // 추천 주제 관련 state
  const [recommendedTopics, setRecommendedTopics] = useState<DebateTopic[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // Update localStorage whenever discussions change (except purely purely initial partial loads, but simple approach is ok)
  // Or better, update in handlers to avoid effect loops if not needed, but Effect is safer for consistency.
  // Let's use handlers for simplicity as requested in plan, but Effect is cleaner for "persistence".
  // Actually, setting state initializes it. Let's start with empty/load.

  const addDiscussion = () => {
    // Reset fields when opening
    setKeyword('');
    setTopic('');
    setDescription('');
    setTimeLimit('10');
    setMaxParticipants('');
    setRecommendedTopics([]);
    setRecommendationError(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  // 추천받기 버튼 핸들러
  const handleRecommend = async () => {
    if (!keyword.trim()) {
      alert('주제 키워드를 입력해주세요.');
      return;
    }

    setIsLoadingRecommendations(true);
    setRecommendationError(null);

    try {
      const topics = await recommendDebateTopics(keyword);
      setRecommendedTopics(topics);
      console.log('✅ Received recommendations:', topics);
    } catch (error) {
      console.error('❌ Failed to get recommendations:', error);
      setRecommendationError('추천을 받는데 실패했습니다. 다시 시도해주세요.');
      setRecommendedTopics([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // 추천 주제 클릭 핸들러
  const handleTopicSelect = (selectedTopic: DebateTopic) => {
    setTopic(selectedTopic.topic);
    setDescription(selectedTopic.description);
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent navigation
    if (window.confirm('정말 삭제하시겠습니까?')) {
      const updated = discussions.filter(d => d.id !== id);
      setDiscussions(updated);
      localStorage.setItem('discussions', JSON.stringify(updated));
    }
  };

  const handleConfirmCreate = async () => {
    if (!topic || !maxParticipants) {
      alert('주제 또는 인원수가 입력되지 않았습니다.');
      return;
    }

    // Prepare payload for backend
    // Backend expects DebateRoomRequestDTO:
    // { participantCount, topicTitle, topicDescription, grade, classroom, teacherId? }

    // For development without Auth, we can pass a teacherId if needed.
    // Let's assume we have a test teacher UUID or relying on Auth if present.
    // If we want to test without auth, we can hardcode a UUID for now or user input.
    // Let's try to infer or use a placeholder.
    // FIXME: Replace with actual teacher ID from context or auth if available.
<<<<<<< HEAD
=======
    // const TEST_TEACHER_ID = "00000000-0000-0000-0000-000000000000"; // Placeholder valid UUID format if needed? 
>>>>>>> 74ed53f4692dd058cf48520a7a50359842621839
    // Actually, backend needs a valid existing user ID if checking DB.
    // We'll leave teacherId empty and hope for Auth, or if user requested "development mode", 
    // they should ensure a user exists. 
    // Let's try to send a valid looking UUID if we strictly need to bypass auth.
    // But since I don't know a valid ID in the DB, I will omit it and rely on Auth or fail with 401.
    // Wait, the plan said "allow creating a room with a provided teacherId".
    // I should probably provide one if I want to test.
    // Let's assume the user has logged in or we use a fallback. 
    // I'll just send the payload.

    const payload = {
      topicTitle: topic,
      topicDescription: description,
      participantCount: parseInt(maxParticipants, 10),
      grade: 1, // Default or select
      classroom: 1, // Default or select
<<<<<<< HEAD
      teacherId: localStorage.getItem('userId') || "11111111-1111-1111-1111-111111111111" // Use logged-in user ID or fallback
=======
      teacherId: localStorage.getItem('userId')
>>>>>>> 74ed53f4692dd058cf48520a7a50359842621839
    };

    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      // Using /api prefix which should be proxied or full URL if CORS allowed
      const response = await fetch('http://localhost:8081/api/ai/debate/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        // data.roomId is the string UUID
        const newId = data.roomId;
        alert("토론방이 생성되었습니다! 토론방 번호: " + (discussions.length + 1));

        // Update local state for display
        const newDiscussion = {
          id: newId,
          title: topic,
          content: description || '설명 없음',
          description: description,
          maxParticipants: maxParticipants,
          displayContent: `인원수: ${maxParticipants}명`
        };
        const updatedDiscussions = [...discussions, newDiscussion];
        setDiscussions(updatedDiscussions);
        localStorage.setItem('discussions', JSON.stringify(updatedDiscussions));
        setShowCreateModal(false);

      } else {
        console.warn("Backend creation failed", response.status, response.statusText);
        const errorText = await response.text();
        alert(`Failed to create room on server: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to connect to backend.");
    }
  };

  return (
    <div className={styles.charactersPanel}>
      <div className={styles.charactersList}>
        {discussions.map((discussion, index) => (
          <div
            key={discussion.id}
            className={styles.characterItem}
            onClick={() => navigate(`/discussion/${discussion.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <button
              className={styles.deleteButton}
              onClick={(e) => handleDelete(e, discussion.id)}
            >
              ×
            </button>
            <div className={styles.roomNumber}>No. {index + 1}</div>
            <h3 className={styles.characterName}>{discussion.title}</h3>
            <p className={styles.characterSummary}>{discussion.description || (discussion.content && discussion.content.split(', ')[1]) || '설명 없음'}</p>
            <div className={styles.participantCount}>인원수: {discussion.maxParticipants || (discussion.content && discussion.content.split('명')[0].split(': ')[1]) || '?'}명</div>
          </div>
        ))}
      </div>
      {localStorage.getItem('userRole') === 'TEACHER' && (
        <button className={styles.createRoomButton} onClick={addDiscussion}>
          방 만들기
        </button>
      )}


      {showCreateModal &&
        createPortal(
          <div className={styles.modalOverlay} onClick={closeCreateModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalHeader}>토론 방 만들기</h3>
              <div className={styles.modalBody}>
                {/* Left Panel: Keyword & Recommend */}
                <div className={styles.leftPanel}>
                  <div className={styles.formRow}>
                    <input
                      className={styles.input}
                      placeholder="주제 키워드 입력"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                    <button
                      className={styles.recommendButton}
                      onClick={handleRecommend}
                      disabled={isLoadingRecommendations}
                    >
                      {isLoadingRecommendations ? '로딩 중...' : '추천받기'}
                    </button>
                  </div>
                  {/* Fill Box */}
                  <div className={styles.leftPanelFillBox}>
                    {recommendationError && (
                      <div style={{ color: 'red', padding: '10px' }}>
                        {recommendationError}
                      </div>
                    )}
                    {recommendedTopics.length > 0 && (
                      <div style={{ padding: '10px' }}>
                        <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>추천 주제 ({recommendedTopics.length}개)</h4>
                        {recommendedTopics.map((item, index) => (
                          <div
                            key={index}
                            onClick={() => handleTopicSelect(item)}
                            style={{
                              padding: '10px',
                              marginBottom: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              backgroundColor: topic === item.topic ? '#e3f2fd' : 'white',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (topic !== item.topic) {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (topic !== item.topic) {
                                e.currentTarget.style.backgroundColor = 'white';
                              }
                            }}
                          >
                            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
                              {index + 1}. {item.topic}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                              {item.description.substring(0, 80)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isLoadingRecommendations && recommendedTopics.length === 0 && !recommendationError && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        키워드를 입력하고 추천받기 버튼을 눌러주세요
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Topic & Description */}
                <div className={styles.rightPanel}>
                  <div className={styles.panelHeader}>
                    <div className={styles.formRow}>
                      <textarea
                        className={styles.topicTextarea}
                        placeholder="토론 주제 입력"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.panelFill}>
                    <div className={styles.formRow} style={{ height: '100%' }}>
                      <textarea
                        className={styles.textarea}
                        style={{ height: '100%' }}
                        placeholder="토론 주제 설명"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <div className={styles.footerControls}>
                  {/* Time Limit */}
                  <div className={styles.footerInputItem}>
                    <label className={styles.footerLabel}>의견 제시 시간</label>
                    <select
                      className={styles.footerSelect}
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                    >
                      <option value="2">2분</option>
                      <option value="3">3분</option>
                      <option value="5">5분</option>
                      <option value="10">10분</option>
                    </select>
                  </div>

                  {/* Max Participants */}
                  <div className={styles.footerInputItem}>
                    <label className={styles.footerLabel}>참여 인원 수</label>
                    <input
                      type="number"
                      className={styles.footerInput}
                      placeholder="숫자"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                    />
                    <span>명</span>
                  </div>
                </div>

                <div className={styles.footerButtons}>
                  <button
                    className={`${styles.modalButton} ${styles.cancelButton}`}
                    onClick={closeCreateModal}
                  >
                    닫기
                  </button>
                  <button
                    className={`${styles.modalButton} ${styles.confirmButton}`}
                    onClick={handleConfirmCreate}
                  >
                    방생성
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default DiscussionPanel;
