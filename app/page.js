'use client';

import { useState } from 'react';
import { RECIPES } from './recipes';
import styles from './page.module.css';

const CAT_EMOJI = {
  '면': '🍜', '국물/찌개': '🥘', '돼지고기': '🥓',
  '닭고기': '🍗', '소고기': '🥩', '분식': '🌶️', '그외': '🍳'
};

function getRecipeEmoji(r) {
  const t = r.title;
  if (t.includes('짜파게티') || t.includes('파스타') || t.includes('국수') || t.includes('막국수') || t.includes('누들') || t.includes('라면')) return '🍜';
  if (t.includes('떡볶이')) return '🌶️';
  if (t.includes('치킨') || t.includes('닭')) return '🍗';
  if (t.includes('삼겹살') || t.includes('제육') || t.includes('동파육') || t.includes('항정살') || t.includes('돼지')) return '🥓';
  if (t.includes('소고기') || t.includes('양지') || t.includes('우삼겹')) return '🥩';
  if (t.includes('찌개') || t.includes('짜글이') || t.includes('감자탕') || t.includes('카레') || t.includes('전골') || t.includes('스키야키')) return '🥘';
  if (t.includes('볶음밥') || t.includes('덮밥') || t.includes('솥밥') || t.includes('오야코')) return '🍚';
  if (t.includes('새우')) return '🍤';
  if (t.includes('두부')) return '🍱';
  if (t.includes('토스트')) return '🍞';
  if (t.includes('계란')) return '🍳';
  if (t.includes('전')) return '🥞';
  return CAT_EMOJI[r.category] || '🍽️';
}

const CATS = ['전체', '면', '국물/찌개', '돼지고기', '닭고기', '소고기', '분식', '그외'];

export default function Home() {
  const [view, setView] = useState('browse');
  const [currentCat, setCurrentCat] = useState('전체');
  const [search, setSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // AI find state
  const [ingredientInput, setIngredientInput] = useState('');
  const [findResult, setFindResult] = useState(null);
  const [findLoading, setFindLoading] = useState(false);
  const [matchedRecipes, setMatchedRecipes] = useState([]);

  // Shopping list state - 새 흐름
  const [shopIngredients, setShopIngredients] = useState('');
  const [shopStep, setShopStep] = useState(1); // 1: 재료 입력, 2: 레시피 선택, 3: 장보기 리스트
  const [possibleRecipes, setPossibleRecipes] = useState([]);
  const [selectedShopRecipes, setSelectedShopRecipes] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState('리스트 복사하기');

  const filteredRecipes = RECIPES.filter(r => {
    const matchCat = currentCat === '전체' || r.category === currentCat;
    const q = search.toLowerCase().trim();
    const matchQ = !q || r.title.toLowerCase().includes(q) || r.ingredients.some(i => i.toLowerCase().includes(q));
    return matchCat && matchQ;
  });

  async function findRecipes() {
    if (!ingredientInput.trim()) return;
    setFindLoading(true);
    setFindResult(null);
    setMatchedRecipes([]);
    try {
      const res = await fetch('/api/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientInput })
      });
      const data = await res.json();
      setFindResult(data.text);
      setMatchedRecipes(data.matched || []);
    } catch (e) {
      setFindResult('오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    }
    setFindLoading(false);
  }

  // Step 1 → Step 2: 가능한 레시피 찾기
  async function findPossibleRecipes() {
    if (!shopIngredients.trim()) return;
    setShopLoading(true);
    try {
      const res = await fetch('/api/possible-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: shopIngredients })
      });
      const data = await res.json();
      const ids = data.recipe_ids || [];
      const recipes = ids.map(id => RECIPES.find(r => r.id === id)).filter(Boolean);
      setPossibleRecipes(recipes);
      setSelectedShopRecipes([]);
      setShopStep(2);
    } catch (e) {
      alert('오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    }
    setShopLoading(false);
  }

  function toggleShopRecipe(id) {
    setSelectedShopRecipes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  // Step 2 → Step 3: 장보기 리스트 만들기
  async function makeShoppingList() {
    if (selectedShopRecipes.length === 0) return;
    setShopLoading(true);
    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          haveIngredients: shopIngredients,
          selectedRecipeIds: selectedShopRecipes
        })
      });
      const data = await res.json();
      setShopItems((data.items || []).map((name, i) => ({ id: i, name, checked: false })));
      setShopStep(3);
    } catch (e) {
      alert('오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    }
    setShopLoading(false);
  }

  function resetShop() {
    setShopStep(1);
    setPossibleRecipes([]);
    setSelectedShopRecipes([]);
    setShopItems([]);
  }

  function toggleItem(id) {
    setShopItems(items => items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  }

  function copyList() {
    const text = shopItems.filter(i => !i.checked).map(i => '• ' + i.name).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg('복사 완료!');
      setTimeout(() => setCopyMsg('리스트 복사하기'), 2000);
    });
  }

  return (
    <div className={styles.app}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoEmoji}>🐷</span>
          <span>토실토실 레시피</span>
        </div>
        <div className={styles.navTabs}>
          <button className={`${styles.navTab} ${view === 'browse' ? styles.active : ''}`} onClick={() => setView('browse')}>레시피</button>
          <button className={`${styles.navTab} ${view === 'ai' ? styles.active : ''}`} onClick={() => setView('ai')}>AI 추천</button>
          <button className={`${styles.navTab} ${view === 'shop' ? styles.active : ''}`} onClick={() => setView('shop')}>장보기</button>
        </div>
      </nav>

      {view === 'browse' && (
        <>
          <div className={styles.searchBar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="레시피 검색 (예: 닭다리살, 떡볶이...)"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.cats}>
            {CATS.map(c => (
              <button
                key={c}
                className={`${styles.catBtn} ${currentCat === c ? styles.active : ''}`}
                onClick={() => setCurrentCat(c)}
              >
                {c === '전체' ? '✨ 전체' : `${CAT_EMOJI[c] || ''} ${c}`}
              </button>
            ))}
          </div>
          <div className={styles.recipeGrid}>
            {filteredRecipes.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🔍</div>
                <div className={styles.emptyText}>검색 결과가 없어요</div>
              </div>
            ) : filteredRecipes.map(r => (
              <div key={r.id} className={styles.recipeCard} onClick={() => setSelectedRecipe(r)}>
                <span className={styles.cardEmoji}>{getRecipeEmoji(r)}</span>
                <div className={styles.cardCat}>{r.category}</div>
                <div className={styles.cardTitle}>{r.title}</div>
                <div className={styles.cardTime}>⏱ {r.time}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'ai' && (
        <div className={styles.aiContainer}>
          <div className={styles.aiHero}>
            <span className={styles.aiHeroEmoji}>🥬</span>
            <h2>오늘 뭐 해먹지?</h2>
            <p>집에 있는 재료로 만들 수 있는 레시피를 찾아드려요</p>
          </div>
          <div className={styles.aiCard}>
            <textarea
              className={styles.aiTextarea}
              rows="3"
              placeholder="집에 있는 재료를 알려주세요&#10;예: 닭다리살, 감자, 대파, 간장"
              value={ingredientInput}
              onChange={e => setIngredientInput(e.target.value)}
            />
            <button className={styles.aiBtn} onClick={findRecipes} disabled={findLoading}>
              <span>✨</span><span>{findLoading ? '찾는 중...' : '레시피 찾기'}</span>
            </button>
            {findLoading && (
              <div className={`${styles.aiResult} ${styles.loading}`}>레시피를 찾고 있어요...</div>
            )}
            {findResult && !findLoading && (
              <div className={styles.aiResult}>{findResult}</div>
            )}
            {matchedRecipes.length > 0 && (
              <div className={styles.recChips}>
                {matchedRecipes.map(id => {
                  const r = RECIPES.find(x => x.id === id);
                  if (!r) return null;
                  return (
                    <div key={r.id} className={styles.recChip} onClick={() => setSelectedRecipe(r)}>
                      {getRecipeEmoji(r)} {r.title}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'shop' && (
        <div className={styles.aiContainer}>
          <div className={styles.aiHero}>
            <span className={styles.aiHeroEmoji}>🛒</span>
            <h2>스마트 장보기</h2>
            <p>가진 재료를 기준으로 부족한 것만 골라드려요</p>
          </div>

          {/* STEP 1: 재료 입력 */}
          {shopStep === 1 && (
            <div className={styles.aiCard}>
              <div className={styles.shopLabel}>집에 있는 재료를 알려주세요</div>
              <textarea
                className={styles.aiTextarea}
                rows="3"
                placeholder="예: 닭고기, 냉동삼겹살, 감자"
                value={shopIngredients}
                onChange={e => setShopIngredients(e.target.value)}
              />
              <div className={styles.shopHint}>
                💡 입력한 재료로 만들 수 있는 레시피를 찾아드릴게요
              </div>
              <button className={styles.aiBtn} onClick={findPossibleRecipes} disabled={shopLoading}>
                <span>🔍</span><span>{shopLoading ? '찾는 중...' : '가능한 레시피 찾기'}</span>
              </button>
              {shopLoading && (
                <div className={`${styles.aiResult} ${styles.loading}`}>레시피를 찾고 있어요...</div>
              )}
            </div>
          )}

          {/* STEP 2: 레시피 선택 */}
          {shopStep === 2 && (
            <div className={styles.aiCard}>
              <div className={styles.shopStepHeader}>
                <button className={styles.backBtn} onClick={resetShop}>← 다시 입력</button>
                <div className={styles.shopLabel}>만들고 싶은 레시피를 골라주세요</div>
              </div>
              {possibleRecipes.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>😅</div>
                  <div className={styles.emptyText}>매칭되는 레시피를 찾지 못했어요</div>
                </div>
              ) : (
                <>
                  <ul className={styles.shopList}>
                    {possibleRecipes.map(r => (
                      <li
                        key={r.id}
                        className={`${styles.shopItem} ${selectedShopRecipes.includes(r.id) ? styles.checked : ''}`}
                        onClick={() => toggleShopRecipe(r.id)}
                      >
                        <div className={styles.shopCheck}>{selectedShopRecipes.includes(r.id) ? '✓' : ''}</div>
                        <span className={styles.recipeChipIcon}>{getRecipeEmoji(r)}</span>
                        <span className={styles.shopName}>{r.title}</span>
                        <span className={styles.recipeTime}>⏱ {r.time}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={styles.aiBtn}
                    onClick={makeShoppingList}
                    disabled={shopLoading || selectedShopRecipes.length === 0}
                  >
                    <span>📝</span>
                    <span>
                      {shopLoading
                        ? '만드는 중...'
                        : selectedShopRecipes.length === 0
                          ? '레시피를 선택해주세요'
                          : `${selectedShopRecipes.length}개 레시피로 장보기 리스트 만들기`}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 3: 장보기 리스트 */}
          {shopStep === 3 && (
            <div className={styles.aiCard}>
              <div className={styles.shopStepHeader}>
                <button className={styles.backBtn} onClick={() => setShopStep(2)}>← 레시피 다시 선택</button>
                <div className={styles.shopLabel}>장 봐야 할 것들 🛒</div>
              </div>
              {shopItems.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🎉</div>
                  <div className={styles.emptyText}>장볼 게 없어요! 다 있으시네요</div>
                </div>
              ) : (
                <>
                  <ul className={styles.shopList}>
                    {shopItems.map(item => (
                      <li
                        key={item.id}
                        className={`${styles.shopItem} ${item.checked ? styles.checked : ''}`}
                        onClick={() => toggleItem(item.id)}
                      >
                        <div className={styles.shopCheck}>{item.checked ? '✓' : ''}</div>
                        <span className={styles.shopName}>{item.name}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={styles.copyBtn} onClick={copyList}>
                    <span>📋</span><span>{copyMsg}</span>
                  </button>
                </>
              )}
              <button className={styles.resetBtn} onClick={resetShop}>
                처음부터 다시 시작
              </button>
            </div>
          )}
        </div>
      )}

      {selectedRecipe && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setSelectedRecipe(null)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEmoji}>{getRecipeEmoji(selectedRecipe)}</span>
                <div className={styles.modalCat}>{selectedRecipe.category}</div>
                <div className={styles.modalTitle}>{selectedRecipe.title}</div>
                <div className={styles.modalTime}>⏱ {selectedRecipe.time}</div>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedRecipe(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.sectionLabel}>재료</div>
              <div className={styles.ingredientsGrid}>
                {selectedRecipe.ingredients.map((i, idx) => (
                  <div key={idx} className={styles.ingredientItem}>{i}</div>
                ))}
              </div>
              {selectedRecipe.sauce && (
                <>
                  <div className={styles.sectionLabel}>양념장</div>
                  <div className={styles.sauceBox}>{selectedRecipe.sauce}</div>
                </>
              )}
              <div className={styles.sectionLabel}>조리 순서</div>
              <ol className={styles.stepsList}>
                {selectedRecipe.steps.map((s, i) => (
                  <li key={i} className={styles.stepItem}>
                    <span className={styles.stepNum}>{i + 1}</span>
                    <span className={styles.stepText}>{s}</span>
                  </li>
                ))}
              </ol>
              {selectedRecipe.tips && (
                <>
                  <div className={styles.sectionLabel}>꿀팁</div>
                  <div className={styles.tipBox}>💡 {selectedRecipe.tips}</div>
                </>
              )}
              <div className={styles.modalSource}>📱 @{selectedRecipe.source}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}