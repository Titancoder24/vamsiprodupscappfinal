import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
  Linking,
  ScrollView,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';
import { SmartTextInput } from '../components/SmartTextInput';
import { supabase } from '../lib/supabase';

const FILTERS = {
  sources: ['The Hindu', 'The Economic Times', 'Press Information Bureau'],
  sourceShort: {
    'The Hindu': 'TH',
    'The Economic Times': 'ET',
    'Press Information Bureau': 'PIB'
  },
  subjects: [
    'All',
    'Polity',
    'Economy',
    'Geography',
    'History',
    'Science & Technology',
    'Environment',
    'Current Affairs',
  ],
};

const SOURCE_LOGOS = {
  'The Hindu': require('../../assets/logos/the_hindu.png'),
  'The Economic Times': require('../../assets/logos/economic_times.png'),
  'Press Information Bureau': require('../../assets/logos/pib.png'),
  'TH': require('../../assets/logos/the_hindu.png'),
  'ET': require('../../assets/logos/economic_times.png'),
  'PIB': require('../../assets/logos/pib.png'),
};

export default function ArticlesScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding } = useWebStyles();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'

  const handleDateChange = (event, dateOrString) => {
    setShowDatePicker(false);

    // On Web, dateOrString might be a string from TextInput onChange
    // On Mobile, it's a Date object
    if (dateOrString instanceof Date) {
      const year = dateOrString.getFullYear();
      const month = String(dateOrString.getMonth() + 1).padStart(2, '0');
      const day = String(dateOrString.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    } else if (typeof dateOrString === 'string') {
      setSelectedDate(dateOrString);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate('');
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const fetchArticles = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log(`[Articles] Fetching with date: ${selectedDate}, sort: ${sortOrder}`);

      // Build query
      let query = supabase
        .from('articles')
        .select('*')
        .eq('is_published', true);

      // Apply filters
      if (selectedSource) {
        query = query.eq('gs_paper', selectedSource);
      }
      if (selectedSubject && selectedSubject !== 'All') {
        query = query.eq('subject', selectedSubject);
      }

      if (selectedDate) {
        // Filter by date (handling timestamp boundaries)
        const startOfDay = `${selectedDate} 00:00:00`;
        const endOfDay = `${selectedDate} 23:59:59`;
        query = query.gte('published_date', startOfDay)
          .lte('published_date', endOfDay);
      }

      // Final ordering
      query = query.order('published_date', { ascending: sortOrder === 'asc', nullsFirst: false })
        .order('created_at', { ascending: sortOrder === 'asc' });

      const { data, error: fetchError } = await query.limit(50);

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }

      console.log(`Fetched ${data?.length || 0} articles with sort ${sortOrder}`);
      setArticles(data || []);
    } catch (err) {
      setError('Failed to load articles. Please try again.');
      console.error('Fetch articles error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSource, selectedSubject, selectedDate, sortOrder]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleRefresh = () => {
    fetchArticles(true);
  };

  // Filter by search query
  const filteredArticles = articles.filter(article => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title?.toLowerCase().includes(query) ||
      article.summary?.toLowerCase().includes(query) ||
      article.subject?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getSourceShort = (source) => {
    if (source === 'The Hindu') return 'TH';
    if (source === 'The Economic Times') return 'ET';
    if (source === 'Press Information Bureau') return 'PIB';
    return source;
  };

  const renderArticleCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.articleCard, { backgroundColor: theme.colors.surface }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
    >
      <View style={styles.articleContent}>
        {/* Header badges */}
        <View style={styles.articleHeader}>
          {item.gs_paper && (
            <View style={[styles.paperBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.paperBadgeText, { color: theme.colors.primary }]}>
                {getSourceShort(item.gs_paper)}
              </Text>
            </View>
          )}
          {item.subject && (
            <View style={[styles.subjectBadge, { backgroundColor: isDark ? '#4A4A52' : '#F0F0F5' }]}>
              <Text style={[styles.subjectBadgeText, { color: theme.colors.textSecondary }]}>
                {item.subject}
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.articleTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Summary */}
        {item.summary && (
          <Text style={[styles.articleSummary, { color: theme.colors.textSecondary }]} numberOfLines={3}>
            {item.summary}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.articleFooter}>
          {item.author && (
            <View style={styles.authorInfo}>
              <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.authorText, { color: theme.colors.textSecondary }]}>
                {item.author}
              </Text>
            </View>
          )}
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {formatDate(item.published_date || item.created_at)}
          </Text>
        </View>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {(typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags).slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}>
                <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSourceCard = (source) => {
    const isSelected = selectedSource === source;
    const logo = SOURCE_LOGOS[source];

    return (
      <TouchableOpacity
        key={source}
        style={[
          styles.sourceCard,
          { backgroundColor: theme.colors.surface },
          isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
        ]}
        onPress={() => setSelectedSource(isSelected ? null : source)}
      >
        {logo && <Image source={logo} style={styles.sourceLogo} resizeMode="contain" />}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Articles Found</Text>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        {error || 'Try adjusting your filters or check back later.'}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleRefresh}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding || 20 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Articles</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding || 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <SmartTextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search articles..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Source Filters */}
        <View style={styles.sourceFilters}>
          {FILTERS.sources.map(source => renderSourceCard(source))}
        </View>

        {/* Date Picker Row */}
        <View style={styles.dateFilterRow}>
          {Platform.OS === 'web' ? (
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.surface, flex: 1 }]}
              onPress={() => {
                // @ts-ignore
                document.getElementById('web-date-picker')?.showPicker?.() || document.getElementById('web-date-picker')?.click();
              }}
            >
              <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.dateButtonText, { color: theme.colors.text, marginLeft: 8 }]}>
                {selectedDate ? formatDate(selectedDate) : 'Pick Date'}
              </Text>
              <input
                id="web-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e, e.target.value)}
                style={{
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  opacity: 0,
                }}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.surface, flex: 1 }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.dateButtonText, { color: theme.colors.text, marginLeft: 8 }]}>
                {selectedDate ? formatDate(selectedDate) : 'Pick Date'}
              </Text>
            </TouchableOpacity>
          )}

          {selectedDate ? (
            <TouchableOpacity style={styles.clearDateBtn} onPress={clearDateFilter}>
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          ) : null}
        </View>

        {Platform.OS !== 'web' && showDatePicker && (
          <DateTimePicker
            value={selectedDate ? new Date(selectedDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Subject Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subjectFilters}
          contentContainerStyle={styles.subjectFiltersContent}
        >
          {FILTERS.subjects.map(subject => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.subjectChip,
                { backgroundColor: selectedSubject === subject ? theme.colors.primary : theme.colors.surface },
              ]}
              onPress={() => setSelectedSubject(subject)}
            >
              <Text style={[
                styles.subjectChipText,
                { color: selectedSubject === subject ? '#FFF' : theme.colors.text }
              ]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Articles List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading articles...
            </Text>
          </View>
        ) : filteredArticles.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.articlesList}>
            {filteredArticles.map(article => (
              <View key={article.id}>
                {renderArticleCard({ item: article })}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  sourceFilters: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sourceCard: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  sourceLogo: {
    width: '80%',
    height: 40,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
  },
  dateButtonText: {
    fontSize: 14,
  },
  clearDateBtn: {
    padding: 4,
  },
  subjectFilters: {
    marginBottom: 16,
  },
  subjectFiltersContent: {
    gap: 8,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  articlesList: {
    gap: 16,
  },
  articleCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  articleContent: {
    flex: 1,
  },
  articleHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  paperBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paperBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  articleTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 8,
  },
  articleSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorText: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
