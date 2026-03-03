'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageCircle, Send, AlertCircle, CheckCircle, Loader2, Image, Clock, Globe, Users, Plus, Minus } from 'lucide-react';

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export default function SMSTestPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  // SMS 폼 상태
  const [smsForm, setSmsForm] = useState({
    to: '',
    text: ''
  });

  // LMS 폼 상태
  const [lmsForm, setLmsForm] = useState({
    to: '',
    text: '',
    subject: ''
  });

  // MMS 폼 상태
  const [mmsForm, setMmsForm] = useState({
    to: '',
    text: '',
    subject: '',
    image: null as File | null
  });

  // 예약 발송 폼 상태
  const [scheduledForm, setScheduledForm] = useState({
    to: '',
    text: '',
    subject: '',
    scheduledDate: ''
  });

  // 해외 문자 폼 상태
  const [internationalForm, setInternationalForm] = useState({
    to: '',
    text: '',
    country: '1'
  });

  // 알림톡 폼 상태
  const [alimTalkForm, setAlimTalkForm] = useState({
    to: '',
    pfId: '',
    templateId: '',
    variables: '',
    disableSms: false
  });

  // 친구톡 폼 상태
  const [friendTalkForm, setFriendTalkForm] = useState({
    to: '',
    text: '',
    pfId: '',
    buttons: '',
    image: null as File | null
  });

  // 대량 발송 폼 상태
  const [bulkForm, setBulkForm] = useState({
    messages: [
      { to: '', text: '' },
      { to: '', text: '' },
      { to: '', text: '' }
    ]
  });

  const handleApiCall = async (endpoint: string, data: any, isFormData: boolean = false) => {
    setLoading(true);
    setResponse(null);

    try {
      const options: RequestInit = {
        method: 'POST',
        ...(isFormData ? { body: data } : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      };

      const result = await fetch(endpoint, options);
      const responseData = await result.json();
      
      setResponse(responseData);
    } catch (error) {
      setResponse({
        success: false,
        message: '네트워크 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      setLoading(false);
    }
  };

  // SMS 발송
  const handleSMSSend = () => {
    handleApiCall('/api/sms/send-sms', smsForm);
  };

  // LMS 발송
  const handleLMSSend = () => {
    handleApiCall('/api/sms/send-lms', lmsForm);
  };

  // MMS 발송
  const handleMMSSend = () => {
    if (!mmsForm.image) {
      alert('이미지를 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('to', mmsForm.to);
    formData.append('text', mmsForm.text);
    formData.append('subject', mmsForm.subject);
    formData.append('image', mmsForm.image);

    handleApiCall('/api/sms/send-mms', formData, true);
  };

  // 예약 발송
  const handleScheduledSend = () => {
    handleApiCall('/api/sms/send-scheduled', scheduledForm);
  };

  // 해외 문자 발송
  const handleInternationalSend = () => {
    handleApiCall('/api/sms/send-international', internationalForm);
  };

  // 알림톡 발송
  const handleAlimTalkSend = () => {
    const data = {
      ...alimTalkForm,
      variables: alimTalkForm.variables ? JSON.parse(alimTalkForm.variables) : {}
    };
    handleApiCall('/api/sms/send-alimtalk', data);
  };

  // 친구톡 발송
  const handleFriendTalkSend = () => {
    if (friendTalkForm.image) {
      const formData = new FormData();
      formData.append('to', friendTalkForm.to);
      formData.append('text', friendTalkForm.text);
      formData.append('pfId', friendTalkForm.pfId);
      formData.append('buttons', friendTalkForm.buttons);
      formData.append('image', friendTalkForm.image);
      
      handleApiCall('/api/sms/send-friendtalk', formData, true);
    } else {
      const data = {
        ...friendTalkForm,
        buttons: friendTalkForm.buttons ? JSON.parse(friendTalkForm.buttons) : []
      };
      handleApiCall('/api/sms/send-friendtalk', data);
    }
  };

  // 대량 발송
  const handleBulkSend = () => {
    const validMessages = bulkForm.messages.filter(msg => msg.to && msg.text);
    if (validMessages.length === 0) {
      alert('최소 1개 이상의 유효한 메시지를 입력해주세요.');
      return;
    }
    handleApiCall('/api/sms/send-many', { messages: validMessages });
  };

  // 대량 발송 메시지 추가
  const addBulkMessage = () => {
    setBulkForm({
      messages: [...bulkForm.messages, { to: '', text: '' }]
    });
  };

  // 대량 발송 메시지 삭제
  const removeBulkMessage = (index: number) => {
    setBulkForm({
      messages: bulkForm.messages.filter((_, i) => i !== index)
    });
  };

  // 대량 발송 메시지 업데이트
  const updateBulkMessage = (index: number, field: 'to' | 'text', value: string) => {
    const newMessages = [...bulkForm.messages];
    newMessages[index][field] = value;
    setBulkForm({ messages: newMessages });
  };

  const ResponseDisplay = () => {
    if (!response) return null;

    return (
      <Alert className={response.success ? 'border-green-500' : 'border-red-500'}>
        {response.success ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
        <AlertTitle>
          {response.success ? '성공' : '실패'}
        </AlertTitle>
        <AlertDescription>
          <div className="mt-2">
            <p><strong>메시지:</strong> {response.message}</p>
            {response.error && (
              <p className="text-red-600"><strong>오류:</strong> {response.error}</p>
            )}
            {response.data && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">응답 데이터 보기</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-8 w-8" />
          SOLAPI SMS 테스트 도구
        </h1>
        <p className="text-gray-600 mt-2">
          다양한 종류의 문자 메시지 발송을 테스트할 수 있습니다.
        </p>
      </div>

      <Tabs defaultValue="sms" className="space-y-6">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          <TabsTrigger value="sms" className="flex items-center gap-1">
            <Send className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="lms" className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            LMS
          </TabsTrigger>
          <TabsTrigger value="mms" className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            MMS
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            대량
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            예약
          </TabsTrigger>
          <TabsTrigger value="international" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            해외
          </TabsTrigger>
          <TabsTrigger value="alimtalk">
            알림톡
          </TabsTrigger>
          <TabsTrigger value="friendtalk">
            친구톡
          </TabsTrigger>
        </TabsList>

        {/* SMS 탭 */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                단문 문자(SMS) 발송
              </CardTitle>
              <CardDescription>
                한글 45자, 영자 90자까지 발송 가능합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sms-to">수신번호</Label>
                <Input
                  id="sms-to"
                  placeholder="01012345678"
                  value={smsForm.to}
                  onChange={(e) => setSmsForm({ ...smsForm, to: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sms-text">메시지 내용</Label>
                <Textarea
                  id="sms-text"
                  placeholder="안녕하세요! 테스트 메시지입니다."
                  value={smsForm.text}
                  onChange={(e) => setSmsForm({ ...smsForm, text: e.target.value })}
                  maxLength={90}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {smsForm.text.length}/90자
                </p>
              </div>
              <Button onClick={handleSMSSend} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                SMS 발송
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LMS 탭 */}
        <TabsContent value="lms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                장문 문자(LMS) 발송
              </CardTitle>
              <CardDescription>
                긴 메시지와 제목을 포함하여 발송할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="lms-to">수신번호</Label>
                <Input
                  id="lms-to"
                  placeholder="01012345678"
                  value={lmsForm.to}
                  onChange={(e) => setLmsForm({ ...lmsForm, to: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lms-subject">제목 (선택사항)</Label>
                <Input
                  id="lms-subject"
                  placeholder="메시지 제목"
                  value={lmsForm.subject}
                  onChange={(e) => setLmsForm({ ...lmsForm, subject: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lms-text">메시지 내용</Label>
                <Textarea
                  id="lms-text"
                  placeholder="긴 메시지 내용을 입력하세요..."
                  value={lmsForm.text}
                  onChange={(e) => setLmsForm({ ...lmsForm, text: e.target.value })}
                  rows={5}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {lmsForm.text.length}자
                </p>
              </div>
              <Button onClick={handleLMSSend} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                LMS 발송
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 대량 발송 탭 */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                대량 문자 발송
              </CardTitle>
              <CardDescription>
                여러 건의 메시지를 한번에 발송합니다. (최대 1000건)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>메시지 목록 ({bulkForm.messages.length}건)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBulkMessage}
                  disabled={bulkForm.messages.length >= 1000}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  메시지 추가
                </Button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bulkForm.messages.map((message, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 min-w-[30px]">
                          {index + 1}.
                        </span>
                        <Input
                          placeholder="수신번호 (01012345678)"
                          value={message.to}
                          onChange={(e) => updateBulkMessage(index, 'to', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="ml-8">
                        <Textarea
                          placeholder="메시지 내용"
                          value={message.text}
                          onChange={(e) => updateBulkMessage(index, 'text', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                    {bulkForm.messages.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBulkMessage(index)}
                        className="mt-1"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-500">
                <p>• 유효한 메시지만 발송됩니다 (수신번호와 내용이 모두 입력된 메시지)</p>
                <p>• 메시지 길이에 따라 SMS/LMS로 자동 판별됩니다</p>
                <p>• 최대 1000건까지 한번에 발송 가능합니다</p>
              </div>

              <Button onClick={handleBulkSend} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                대량 발송 ({bulkForm.messages.filter(msg => msg.to && msg.text).length}건)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MMS 탭 */}
        <TabsContent value="mms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                사진 문자(MMS) 발송
              </CardTitle>
              <CardDescription>
                이미지와 함께 메시지를 발송합니다. (200KB 이내, JPG 파일만)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mms-to">수신번호</Label>
                <Input
                  id="mms-to"
                  placeholder="01012345678"
                  value={mmsForm.to}
                  onChange={(e) => setMmsForm({ ...mmsForm, to: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="mms-subject">제목 (선택사항)</Label>
                <Input
                  id="mms-subject"
                  placeholder="메시지 제목"
                  value={mmsForm.subject}
                  onChange={(e) => setMmsForm({ ...mmsForm, subject: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="mms-text">메시지 내용</Label>
                <Textarea
                  id="mms-text"
                  placeholder="사진과 함께 보낼 메시지"
                  value={mmsForm.text}
                  onChange={(e) => setMmsForm({ ...mmsForm, text: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="mms-image">이미지 파일</Label>
                <Input
                  id="mms-image"
                  type="file"
                  accept=".jpg,.jpeg"
                  onChange={(e) => setMmsForm({ ...mmsForm, image: e.target.files?.[0] || null })}
                />
                <p className="text-sm text-gray-500 mt-1">
                  JPG 파일만, 200KB 이내
                </p>
              </div>
              <Button onClick={handleMMSSend} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Image className="h-4 w-4 mr-2" />}
                MMS 발송
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 예약 발송 탭 */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                예약 발송
              </CardTitle>
              <CardDescription>
                원하는 시간에 메시지를 발송하도록 예약합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scheduled-to">수신번호</Label>
                <Input
                  id="scheduled-to"
                  placeholder="01012345678"
                  value={scheduledForm.to}
                  onChange={(e) => setScheduledForm({ ...scheduledForm, to: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="scheduled-date">예약 날짜/시간</Label>
                <Input
                  id="scheduled-date"
                  type="datetime-local"
                  value={scheduledForm.scheduledDate}
                  onChange={(e) => setScheduledForm({ ...scheduledForm, scheduledDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="scheduled-subject">제목 (선택사항)</Label>
                <Input
                  id="scheduled-subject"
                  placeholder="예약 메시지 제목"
                  value={scheduledForm.subject}
                  onChange={(e) => setScheduledForm({ ...scheduledForm, subject: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="scheduled-text">메시지 내용</Label>
                <Textarea
                  id="scheduled-text"
                  placeholder="예약 발송할 메시지 내용"
                  value={scheduledForm.text}
                  onChange={(e) => setScheduledForm({ ...scheduledForm, text: e.target.value })}
                />
              </div>
              <Button onClick={handleScheduledSend} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                예약 발송 등록
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 해외 문자 탭 */}
        <TabsContent value="international">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                해외 문자 발송
              </CardTitle>
              <CardDescription>
                해외로 SMS를 발송합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="intl-country">국가번호</Label>
                <Input
                  id="intl-country"
                  placeholder="1 (미국)"
                  value={internationalForm.country}
                  onChange={(e) => setInternationalForm({ ...internationalForm, country: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="intl-to">수신번호 (국제번호 제외)</Label>
                <Input
                  id="intl-to"
                  placeholder="1234567890"
                  value={internationalForm.to}
                  onChange={(e) => setInternationalForm({ ...internationalForm, to: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="intl-text">메시지 내용</Label>
                <Textarea
                  id="intl-text"
                  placeholder="International message"
                  value={internationalForm.text}
                  onChange={(e) => setInternationalForm({ ...internationalForm, text: e.target.value })}
                />
              </div>
              <Button onClick={handleInternationalSend} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
                해외 SMS 발송
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알림톡 탭 */}
        <TabsContent value="alimtalk">
          <Card>
            <CardHeader>
              <CardTitle>알림톡 발송</CardTitle>
              <CardDescription>
                카카오 비즈니스 알림톡을 발송합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="alim-to">수신번호</Label>
                <Input
                  id="alim-to"
                  placeholder="01012345678"
                  value={alimTalkForm.to}
                  onChange={(e) => setAlimTalkForm({ ...alimTalkForm, to: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="alim-pfid">pfId</Label>
                <Input
                  id="alim-pfid"
                  placeholder="비즈니스 채널 pfId"
                  value={alimTalkForm.pfId}
                  onChange={(e) => setAlimTalkForm({ ...alimTalkForm, pfId: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="alim-template">템플릿 ID</Label>
                <Input
                  id="alim-template"
                  placeholder="알림톡 템플릿 ID"
                  value={alimTalkForm.templateId}
                  onChange={(e) => setAlimTalkForm({ ...alimTalkForm, templateId: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="alim-variables">치환문구 (JSON 형식)</Label>
                <Textarea
                  id="alim-variables"
                  placeholder='{"#{변수명}": "값"}'
                  value={alimTalkForm.variables}
                  onChange={(e) => setAlimTalkForm({ ...alimTalkForm, variables: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alim-disable-sms"
                  checked={alimTalkForm.disableSms}
                  onCheckedChange={(checked) => setAlimTalkForm({ ...alimTalkForm, disableSms: !!checked })}
                />
                <Label htmlFor="alim-disable-sms">문자 대체발송 비활성화</Label>
              </div>
              <Button onClick={handleAlimTalkSend} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                알림톡 발송
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 친구톡 탭 */}
        <TabsContent value="friendtalk">
          <Card>
            <CardHeader>
              <CardTitle>친구톡 발송</CardTitle>
              <CardDescription>
                카카오 비즈니스 친구톡을 발송합니다. (버튼 및 이미지 포함 가능)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="friend-to">수신번호</Label>
                <Input
                  id="friend-to"
                  placeholder="01012345678"
                  value={friendTalkForm.to}
                  onChange={(e) => setFriendTalkForm({ ...friendTalkForm, to: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="friend-pfid">pfId</Label>
                <Input
                  id="friend-pfid"
                  placeholder="비즈니스 채널 pfId"
                  value={friendTalkForm.pfId}
                  onChange={(e) => setFriendTalkForm({ ...friendTalkForm, pfId: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="friend-text">메시지 내용</Label>
                <Textarea
                  id="friend-text"
                  placeholder="친구톡 메시지 내용 (2000byte 이내)"
                  value={friendTalkForm.text}
                  onChange={(e) => setFriendTalkForm({ ...friendTalkForm, text: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="friend-buttons">버튼 (JSON 형식, 최대 5개)</Label>
                <Textarea
                  id="friend-buttons"
                  placeholder='[{"buttonType": "WL", "buttonName": "홈페이지", "linkMo": "https://example.com"}]'
                  value={friendTalkForm.buttons}
                  onChange={(e) => setFriendTalkForm({ ...friendTalkForm, buttons: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="friend-image">이미지 파일 (선택사항)</Label>
                <Input
                  id="friend-image"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => setFriendTalkForm({ ...friendTalkForm, image: e.target.files?.[0] || null })}
                />
                <p className="text-sm text-gray-500 mt-1">
                  PNG/JPG 파일, 500KB 이내
                </p>
              </div>
              <Button onClick={handleFriendTalkSend} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                친구톡 발송
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 응답 결과 표시 */}
      {(response || loading) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : response?.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              API 응답 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>API 호출 중...</span>
              </div>
            ) : (
              <ResponseDisplay />
            )}
          </CardContent>
        </Card>
      )}

      {/* 사용 가이드 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>사용 가이드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <Badge variant="outline" className="mb-2">중요</Badge>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>전화번호는 <code>01012345678</code> 형식으로 입력하세요</li>
                <li>특수문자 (+, -, *) 등은 사용할 수 없습니다</li>
                <li>SOLAPI 환경변수(.env.local)가 올바르게 설정되어야 합니다</li>
              </ul>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">파일 제한</Badge>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>MMS 이미지: 200KB 이내, JPG 파일만</li>
                <li>친구톡 이미지: 500KB 이내, PNG/JPG 파일</li>
                <li>친구톡 버튼: 최대 5개까지</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
