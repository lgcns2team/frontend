import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { recommendDebateTopics, type DebateTopic } from '../../../shared/api/debate-api';
import { createShortDiscussionRoom, getDiscussionRooms, type DiscussionRoom } from '../../../shared/lib/useStomp';
import styles from './DiscussionPanel.module.css';

const DiscussionPanel: React.FC = () => {
  const [discussions, setDiscussions] = useState<DiscussionRoom[]>([]);
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

  // Fetch rooms on mount
  const fetchRooms = async () => {
    const rooms = await getDiscussionRooms();
    setDiscussions(rooms);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

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

  // Note: Deleting rooms from backend/Redis isn't fully implemented in the hook yet.
  // We can just filter locally for now or add a delete API calling function if needed.
  // User asked for "fetch from Redis", deletion logic might need backend support.
  // For now, we'll keep the UI deletion but it won't persist to backend unless API exists.
  // Assuming strict requirement update: "Get from Redis". Deletion should probably be ignored or mock for now as backend delete endpoint isn't clarified.
  // I will just remove it from local view for now.
  const handleDelete = (e: React.MouseEvent, id: string | undefined) => {
    e.stopPropagation(); // Prevent navigation
    if (!id) return;
    if (window.confirm('정말 삭제하시겠습니까? (현재 뷰에서만 삭제됩니다)')) {
      // TODO: Implement backend delete API
      setDiscussions(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleConfirmCreate = async () => {
    if (!topic || !maxParticipants) {
      alert('주제 또는 인원수가 입력되지 않았습니다.');
      return;
    }

    const payload = {
      topicTitle: topic,
      topicDescription: description,
      participantCount: parseInt(maxParticipants, 10),
      grade: 1, // Default or select
      classroom: 1, // Default or select
      teacherId: localStorage.getItem('userId') || ''
    };

    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    const result = await createShortDiscussionRoom(payload);

    if (result.success) {
      alert("Room Created! Room ID: " + result.roomId);
      setShowCreateModal(false);
      // Refresh list from backend
      fetchRooms();
    } else {
      alert(`Failed to create room: ${result.error}`);
    }
  };

  return (
    <div className={styles.charactersPanel}>
      <div className={styles.charactersList}>
        {discussions.map((discussion, index) => (
          <div
            key={discussion.id || index}
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
            <h3 className={styles.characterName}>{discussion.title || discussion.topicTitle}</h3>
            <p className={styles.characterSummary}>{discussion.description || discussion.topicDescription || '설명 없음'}</p>
            <div className={styles.participantCount}>인원수: {discussion.participantCount}명</div>
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
