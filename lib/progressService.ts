import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

export interface ProgressPhoto {
  id: string;
  user_id: string;
  goal_id: string;
  photo_url: string;
  date_uploaded: string;
  check_in_date?: string;
  note?: string;
}

export interface CheckInData {
  goalId: string;
  userId: string;
  photoUri?: string;
  note?: string;
  checkInDate?: Date;
}

class ProgressService {
  /**
   * Upload a photo to Supabase storage
   */
  async uploadPhoto(uri: string, fileName: string, userId: string, goalId?: string, photoType: string = 'progress', checkInDate?: Date): Promise<string | null> {
    try {
      
      // Use checkInDate for the file path if provided
      const fileExt = 'jpg';
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      let datePrefix = '';
      if (checkInDate) {
        // Format as YYYY-MM-DD
        const yyyy = checkInDate.getFullYear();
        const mm = String(checkInDate.getMonth() + 1).padStart(2, '0');
        const dd = String(checkInDate.getDate()).padStart(2, '0');
        datePrefix = `${yyyy}-${mm}-${dd}_`;
      }
      
      // Create new folder structure: {user_id}/goal_{goal_id}_{photo_type}/ or {user_id}/profile/
      let filePath: string;
      if (goalId) {
        // Goal-related photo: {user_id}/goal_{goal_id}_{photo_type}/
        filePath = `${userId}/goal_${goalId}_${photoType}/${datePrefix}${uniqueFileName}`;
      } else {
        // Profile photo: {user_id}/profile/
        filePath = `${userId}/profile/${datePrefix}${uniqueFileName}`;
      }
      
      // REACT NATIVE COMPATIBLE UPLOAD: Use FormData with original URI
      // Create FormData for React Native compatibility
      const formData = new FormData();
      
      // For React Native, append the file directly from URI
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: uniqueFileName,
      } as any);
      
      const { data, error } = await supabase.storage
        .from('users')
        .upload(filePath, formData, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('FormData upload failed:', error);
        return null;
      }

      console.log('Upload successful, path:', data.path);

      // Verify uploaded file immediately  
      console.log('Verifying uploaded file exists...');
      try {
        // Try to download a small chunk to verify file exists and has content
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from('users')
          .download(data.path);
        
        if (downloadError) {
          console.error('🚨 CRITICAL: File download failed immediately after upload!', downloadError);
          console.error('This indicates the file was not actually saved to storage.');
          return null;
        } else {
          if (downloadData.size === 0) {
            console.error('🚨 CRITICAL: Downloaded file is 0 bytes!');
            return null;
          }
        }
      } catch (verifyError) {
        console.error('🚨 CRITICAL: Error verifying upload:', verifyError);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('users')
        .getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadPhoto:', error);
      return null;
    }
  }



  /**
   * Create a check-in entry with optional photo
   */
  async createCheckIn(checkInData: CheckInData): Promise<boolean> {
    try {
      let photoUrl: string | null = null;

      // Debug: Check if the authenticated user matches the passed user ID
      const { data: { user: authUser } } = await supabase.auth.getUser();

      // Upload photo if provided
      if (checkInData.photoUri) {
        console.log('Uploading photo:', checkInData.photoUri);
        photoUrl = await this.uploadPhoto(
          checkInData.photoUri,
          'progress-photo.jpg',
          checkInData.userId,
          checkInData.goalId,
          'progress',
          checkInData.checkInDate
        );
      }

      // Save check-in to database
      const insertData = {
        user_id: authUser?.id || checkInData.userId, // Use authenticated user ID
        goal_id: checkInData.goalId,
        photo_url: photoUrl || 'no-photo', // Use placeholder since column is NOT NULL
        photo_type: 'progress', // Default photo type for check-ins
        check_in_date: checkInData.checkInDate ? checkInData.checkInDate.toISOString().slice(0, 10) : undefined,
      };
      
      const { data, error } = await supabase
        .from('progress_photos')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Error saving check-in:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createCheckIn:', error);
      return false;
    }
  }

  /**
   * Get progress photos for a goal
   */
  async getProgressPhotos(goalId: string, userId: string): Promise<ProgressPhoto[]> {
    try {
      // Verify authenticated user matches
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const actualUserId = authUser?.id || userId;
      
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('goal_id', goalId)
        .eq('user_id', actualUserId)
        .order('date_uploaded', { ascending: false });

      if (error) {
        console.error('Error fetching progress photos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getProgressPhotos:', error);
      return [];
    }
  }

  /**
   * Check if user has checked in for a specific goal on a specific date
   */
  async hasCheckedInToday(goalId: string, userId: string, date?: Date): Promise<boolean> {
    try {
      const checkDate = date || new Date();
      
      // Format as YYYY-MM-DD to match check_in_date field
      const yyyy = checkDate.getFullYear();
      const mm = String(checkDate.getMonth() + 1).padStart(2, '0');
      const dd = String(checkDate.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      // Verify authenticated user matches
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const actualUserId = authUser?.id || userId;

      const { data, error } = await supabase
        .from('progress_photos')
        .select('id, check_in_date')
        .eq('goal_id', goalId)
        .eq('user_id', actualUserId)
        .eq('check_in_date', dateString)
        .limit(1);

      if (error) {
        console.error('Error checking if checked in:', error);
        return false;
      }
      return (data && data.length > 0) || false;
    } catch (error) {
      console.error('Error in hasCheckedInToday:', error);
      return false;
    }
  }

  /**
   * Get all check-ins for a user within a date range
   */
  async getCheckInsForDateRange(userId: string, startDate: Date, endDate: Date): Promise<Array<{goal_id: string, check_in_date: string}>> {
    try {
      // Format dates as YYYY-MM-DD
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Verify authenticated user matches
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const actualUserId = authUser?.id || userId;

      const { data, error } = await supabase
        .from('progress_photos')
        .select('goal_id, check_in_date')
        .eq('user_id', actualUserId)
        .gte('check_in_date', startDateStr)
        .lte('check_in_date', endDateStr);

      if (error) {
        console.error('Error fetching check-ins for date range:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getCheckInsForDateRange:', error);
      return [];
    }
  }



  /**
   * Get check-in count for a goal
   */
  async getCheckInCount(goalId: string, userId: string): Promise<number> {
    try {
      // Verify authenticated user matches
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const actualUserId = authUser?.id || userId;
      
      const { count, error } = await supabase
        .from('progress_photos')
        .select('*', { count: 'exact', head: true })
        .eq('goal_id', goalId)
        .eq('user_id', actualUserId);

      if (error) {
        console.error('Error getting check-in count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getCheckInCount:', error);
      return 0;
    }
  }

  /**
   * Get all check-ins for multiple goals in a date range (batch query)
   */
  async getCheckInsForGoalsInDateRange(userId: string, goalIds: string[], startDate: Date, endDate: Date): Promise<Array<{goal_id: string, check_in_date: string}>> {
    try {
      if (goalIds.length === 0) return [];
      
      // Format dates as YYYY-MM-DD
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Verify authenticated user matches
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const actualUserId = authUser?.id || userId;

      const { data, error } = await supabase
        .from('progress_photos')
        .select('goal_id, check_in_date')
        .eq('user_id', actualUserId)
        .in('goal_id', goalIds)
        .gte('check_in_date', startDateStr)
        .lte('check_in_date', endDateStr);

      if (error) {
        console.error('Error fetching batch check-ins:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCheckInsForGoalsInDateRange:', error);
      return [];
    }
  }

  /**
   * Delete a check-in and its associated photo
   */
  async deleteCheckIn(checkInId: string, photoUrl?: string): Promise<boolean> {
    try {

      // Delete photo from storage if it exists and is not a placeholder
      if (photoUrl && photoUrl !== 'no-photo' && photoUrl.includes('users/')) {
        try {
          // Extract file path from URL - handle folder structure
          const urlParts = photoUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const userId = urlParts[urlParts.length - 2];
          const filePath = `${userId}/${fileName}`;
          
          const { error: storageError } = await supabase.storage
            .from('users')
            .remove([filePath]);

          if (storageError) {
            console.error('Error deleting photo from storage:', storageError);
            // Continue with database deletion even if storage deletion fails
          }
        } catch (storageError) {
          console.error('Error parsing photo URL or deleting from storage:', storageError);
          // Continue with database deletion
        }
      }

      // Delete check-in record from database
      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', checkInId);

      if (error) {
        console.error('Error deleting check-in from database:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in deleteCheckIn:', error);
      return false;
    }
  }
}

export const progressService = new ProgressService(); 