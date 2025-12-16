import React, { useState } from 'react';
import styles from './DiscussionPanel.module.css';

const DiscussionPanel: React.FC = () => {
  const [discussions, setDiscussions] = useState([
    { id: 1, title: '리스트 1', content: '리스트 1 내용입니다.' },
    { id: 2, title: '리스트 2', content: '리스트 2 내용입니다.' },
  ]);

  const addDiscussion = () => {
    const newDiscussion = {
      id: discussions.length + 1,
      title: `리스트 ${discussions.length + 1}`,
      content: `리스트 ${discussions.length + 1} 내용입니다.`,
    };
    setDiscussions([...discussions, newDiscussion]);
  };

  return (
    <div className={styles.charactersPanel}>
      <div className={styles.charactersList}>
        {discussions.map((discussion) => (
          <div key={discussion.id} className={styles.characterItem}>
            <h3 className={styles.characterName}>{discussion.title}</h3>
            <p className={styles.characterSummary}>{discussion.content}</p>
          </div>
        ))}
      </div>
      <button className={styles.createRoomButton} onClick={addDiscussion}>
        방 만들기
      </button>
    </div>
  );
};

export default DiscussionPanel;
