import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { recommendDebateTopics, type DebateTopic } from '../../../shared/api/debate-api';
import { createShortDiscussionRoom, getDiscussionRooms, deleteDiscussionRoom, type DiscussionRoom } from '../../../shared/lib/useStomp';
import { GuestLoginPrompt, isGuestUser } from '../../../shared/components/GuestLoginPrompt';
import styles from './DiscussionPanel.module.css';

const DiscussionPanel: React.FC = () => {
  const [discussions, setDiscussions] = useState<DiscussionRoom[]>([]);
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('1');
  const [classroom, setClassroom] = useState('1');

  const [showCreateModal, setShowCreateModal] = useState(false);

  // 추천 주제 관련 state
  const [recommendedTopics, setRecommendedTopics] = useState<DebateTopic[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [loadingDots, setLoadingDots] = useState(1); // 1, 2, or 3 dots
  const loadingIntervalRef = useRef<number | null>(null);

  // Fetch rooms on mount
  const fetchRooms = async () => {
    const rooms = await getDiscussionRooms();
    setDiscussions(rooms);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Animate loading dots (로딩중., 로딩중.., 로딩중...)
  useEffect(() => {
    if (isLoadingRecommendations) {
      loadingIntervalRef.current = window.setInterval(() => {
        setLoadingDots(prev => (prev % 3) + 1);
      }, 400);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      setLoadingDots(1);
    }
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isLoadingRecommendations]);

  const addDiscussion = () => {
    // Reset fields when opening
    setKeyword('');
    setTopic('');
    setDescription('');
    setGrade('1');
    setClassroom('1');
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
  const handleDelete = async (e: React.MouseEvent, id: string | undefined) => {
    e.stopPropagation(); // Prevent navigation
    if (!id) return;
    if (window.confirm('정말 삭제하시겠습니까?')) {
      const result = await deleteDiscussionRoom(id);
      if (result.success) {
        // Remove from local state and refresh from backend
        setDiscussions(prev => prev.filter(d => d.id !== id));
        console.log('Room deleted successfully:', id);
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    }
  };

  const handleRoomClick = (discussion: DiscussionRoom) => {
    const userRole = localStorage.getItem('userRole');

    // Teachers can access all rooms
    if (userRole === 'TEACHER') {
      navigate(`/discussion/${discussion.id}`);
      return;
    }

    // Students must match grade AND classroom
    const userGrade = localStorage.getItem('userGrade');
    const userClassroom = localStorage.getItem('userClassroom');

    const roomGrade = discussion.grade;
    const roomClassroom = discussion.classroom;

    // Check for mismatches
    const gradeMismatch = userGrade && roomGrade && parseInt(userGrade) !== roomGrade;
    const classroomMismatch = userClassroom && roomClassroom && parseInt(userClassroom) !== roomClassroom;

    if (gradeMismatch && classroomMismatch) {
      alert('학년과 반이 다릅니다');
      return;
    } else if (gradeMismatch) {
      alert('학년이 다릅니다');
      return;
    } else if (classroomMismatch) {
      alert('반이 다릅니다');
      return;
    }

    // Validation passed
    navigate(`/discussion/${discussion.id}`);
  };

  const handleConfirmCreate = async () => {
    if (!topic) {
      alert('주제가 입력되지 않았습니다.');
      return;
    }

    const payload = {
      topicTitle: topic,
      topicDescription: description,
      participantCount: 30, // 기본값
      grade: parseInt(grade, 10),
      classroom: parseInt(classroom, 10),
      // teacherId: localStorage.getItem('userId') || ''
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

  // 게스트 사용자는 로그인 유도 화면 표시
  if (isGuestUser()) {
    return <GuestLoginPrompt featureName="토론" />;
  }

  return (
    <div className={styles.charactersPanel}>
      <div className={styles.charactersList}>
        {discussions.map((discussion, index) => (
          <div
            key={discussion.id || index}
            className={styles.characterItem}
            onClick={() => handleRoomClick(discussion)}
            style={{ cursor: 'pointer' }}
          >
            {localStorage.getItem('userRole') === 'TEACHER' && (
              <button
                className={styles.deleteButton}
                onClick={(e) => handleDelete(e, discussion.id)}
              >
                ×
              </button>
            )}
            <div className={styles.roomNumber}>No. {index + 1}</div>
            <h3 className={styles.characterName}>{discussion.title || discussion.topicTitle}</h3>
            <p className={styles.characterSummary}>{discussion.description || discussion.topicDescription || '설명 없음'}</p>
            <div className={styles.participantCount}>{discussion.grade || '-'}학년 {discussion.classroom || '-'}반</div>
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
                      {isLoadingRecommendations ? `로딩중${'.'.repeat(loadingDots)}` : '추천받기'}
                    </button>
                  </div>
                  {/* Fill Box */}
                  <div className={styles.leftPanelFillBox}>
                    {/* Loading Spinner Overlay */}
                    {isLoadingRecommendations && (
                      <div className={styles.spinnerOverlay}>
                        <div className={styles.spinner}></div>
                        <div className={styles.spinnerText}>AI가 토론 주제를 선정하고 있습니다</div>
                      </div>
                    )}

                    {recommendationError && (
                      <div style={{ color: 'red', padding: '10px' }}>
                        {recommendationError}
                      </div>
                    )}
                    {recommendedTopics.length > 0 && (
                      <div style={{ padding: '10px' }}>
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
                              {item.description}
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
                  {/* Grade */}
                  <div className={styles.footerInputItem}>
                    <label className={styles.footerLabel}>학년</label>
                    <select
                      className={styles.footerSelect}
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    >
                      <option value="1">1학년</option>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                      <option value="4">4학년</option>
                      <option value="5">5학년</option>
                      <option value="6">6학년</option>
                    </select>
                  </div>

                  {/* Classroom */}
                  <div className={styles.footerInputItem}>
                    <label className={styles.footerLabel}>반</label>
                    <select
                      className={styles.footerSelect}
                      value={classroom}
                      onChange={(e) => setClassroom(e.target.value)}
                    >
                      <option value="1">1반</option>
                      <option value="2">2반</option>
                      <option value="3">3반</option>
                      <option value="4">4반</option>
                      <option value="5">5반</option>
                      <option value="6">6반</option>
                      <option value="7">7반</option>
                      <option value="8">8반</option>
                      <option value="9">9반</option>
                      <option value="10">10반</option>
                      <option value="11">11반</option>
                      <option value="12">12반</option>
                    </select>
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
