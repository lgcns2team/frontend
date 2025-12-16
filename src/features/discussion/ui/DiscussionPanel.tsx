import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent navigation
    if (window.confirm('정말 삭제하시겠습니까?')) {
      const updated = discussions
        .filter(d => d.id !== id)
        .map((d, index) => ({ ...d, id: index + 1 })); // Re-index sequentially
      setDiscussions(updated);
      localStorage.setItem('discussions', JSON.stringify(updated));
    }
  };

  const handleConfirmCreate = () => {
    if (!topic || !maxParticipants) {
      alert('주제 또는 인원수가 입력되지 않았습니다.');
      return;
    }

    const newDiscussion = {
      id: discussions.length + 1, // Sequential ID
      title: topic,
      content: description || '설명 없음', // Store description separately if possible, but keep existing structure for now. 
      // Actually, DiscussionRoomPage needs description.
      // The current structure puts "content" as the summary string...
      // Let's store raw data too or parsing will be annoying.
      // Let's update the object structure slightly to be more robust, or just pack it.
      // For now, let's store `description` and `maxParticipants` as fields.
      description: description,
      maxParticipants: maxParticipants,
      // Keep formatted content for the list view if needed, or render dynamically
      displayContent: `인원수: ${maxParticipants}명`
    };

    // Combining for backward compat if I wasn't refactoring, but I am.
    // Let's stick to the existing usage of .content for the list view for now to minimize breakage?
    // The list uses .content.
    const discussionEntry = {
      ...newDiscussion,
      content: `인원수: ${maxParticipants}명, ${description || '설명 없음'}`
    };

    const updatedDiscussions = [...discussions, discussionEntry];
    setDiscussions(updatedDiscussions);
    localStorage.setItem('discussions', JSON.stringify(updatedDiscussions));
    setShowCreateModal(false);
  };

  return (
    <div className={styles.charactersPanel}>
      <div className={styles.charactersList}>
        {discussions.map((discussion) => (
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
            <div className={styles.roomNumber}>No. {discussion.id}</div>
            <h3 className={styles.characterName}>{discussion.title}</h3>
            <p className={styles.characterSummary}>{discussion.content}</p>
          </div>
        ))}
      </div>
      <button className={styles.createRoomButton} onClick={addDiscussion}>
        방 만들기
      </button>


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
                    <button className={styles.recommendButton}>추천받기</button>
                  </div>
                  {/* Fill Box */}
                  <div className={styles.leftPanelFillBox}>
                    {/* Content can go here later */}
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
