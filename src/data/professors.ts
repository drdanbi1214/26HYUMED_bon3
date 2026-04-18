// 서울 병원 진료과 (가나다순)
export const PROF_DEPTS_SEOUL = [
  "가정의학과", "감염내과", "내분비대사내과", "류마티스병원", "마취통증의학과",
  "방사선종양학과", "병리과", "비뇨의학과", "산부인과", "성형외과",
  "소아내분비과", "소아외과", "소아청소년과", "소화기내과", "신경과",
  "신경외과", "신장내과", "심장내과", "심창혈관흉부외과", "안과",
  "영상의학과", "외과", "응급의학과", "이비인후과", "임상약리학과",
  "입원의학과", "재활의학과", "정신건강의학과", "정형외과", "중환자의학과",
  "직업환경의학과", "진단검사의학과", "치과", "피부과", "핵의학과",
  "혈액종양내과", "호흡기알레르기내과",
].sort((a, b) => a.localeCompare(b, "ko"));

// 서울 병원 교수님 미리뵙기 링크
export const PROF_LINKS_SEOUL: Record<string, string> = {
  "가정의학과": "https://seoul.hyumc.com/seoul/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=1&searchHospCd=&searchKeyword=%EA%B0%80%EC%A0%95%EC%9D%98%ED%95%99%EA%B3%BC",
  "감염내과": "https://seoul.hyumc.com/seoul/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=2&searchHospCd=&searchKeyword=%EA%B0%90%EC%97%BC%EB%82%B4%EA%B3%BC",
  "내분비대사내과": "https://seoul.hyumc.com/seoul/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=4&searchHospCd=&searchKeyword=%EB%82%B4%EB%B6%84%EB%B9%84%EB%8C%80%EC%82%AC%EB%82%B4%EA%B3%BC",
  "마취통증의학과": "https://seoul.hyumc.com/seoul/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=6&searchHospCd=&searchKeyword=%EB%A7%88%EC%B7%A8%ED%86%B5%EC%A6%9D%EC%9D%98%ED%95%99%EA%B3%BC",
  "방사선종양학과": "https://seoul.hyumc.com/seoul/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=8&searchHospCd=&searchKeyword=%EB%B0%A9%EC%82%AC%EC%84%A0%EC%A2%85%EC%96%91%ED%95%99%EA%B3%BC",
  "병리과": "https://seoul.hyumc.com/seoul/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=9&searchHospCd=&searchKeyword=%EB%B3%91%EB%A6%AC%EA%B3%BC",
  "비뇨의학과": "https://seoul.hyumc.com/seoul/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=10&searchHospCd=&searchKeyword=%EB%B9%84%EB%87%A8%EC%9D%98%ED%95%99%EA%B3%BC",
  "소아외과": "https://seoul.hyumc.com/seoul/mediteam/mediofCent.do?action=detailList&returnAction=list&currentPageNo=1&recordCountPerPage=8&searchCondition1=seqMediteam&searchCommonSeq=14&searchCommonCd1=&searchCommonCd2=&searchCondition2=all&searchKeyword=%EC%86%8C%EC%95%84%EC%99%B8%EA%B3%BC&searchKeyword2=&empyId=&bbsId=bestPartner&nttSeq=",
  "소아청소년과": "https://seoul.hyumc.com/seoul/mediteam/mediofCent.do?action=detailList&returnAction=list&currentPageNo=1&recordCountPerPage=8&searchCondition1=seqMediteam&searchCommonSeq=15&searchCommonCd1=&searchCommonCd2=&searchCondition2=all&searchKeyword=%EC%86%8C%EC%95%84%EC%B2%AD%EC%86%8C%EB%85%84%EA%B3%BC&searchKeyword2=&userTab1=mediteam&empyId=&bbsId=bestPartner&nttSeq=",
  "소화기내과": "https://seoul.hyumc.com/seoul/mediteam/mediofCent.do?action=detailList&returnAction=list&currentPageNo=1&recordCountPerPage=8&searchCondition1=seqMediteam&searchCommonSeq=16&searchCommonCd1=&searchCommonCd2=&searchCondition2=all&searchKeyword=%EC%86%8C%ED%99%94%EA%B8%B0%EB%82%B4%EA%B3%BC&searchKeyword2=&userTab1=mediteam&empyId=&bbsId=bestPartner&nttSeq=",
  "신경과": "https://seoul.hyumc.com/seoul/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=17&searchKeyword=%EC%8B%A0%EA%B2%BD%EA%B3%BC",
  "신경외과": "https://seoul.hyumc.com/seoul/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=18&searchKeyword=%EC%8B%A0%EA%B2%BD%EC%99%B8%EA%B3%BC",
  "신장내과": "https://seoul.hyumc.com/seoul/mediteam/mediofCent.do?action=detailList&returnAction=list&currentPageNo=1&recordCountPerPage=8&searchCondition1=all&searchCommonSeq=19&searchCommonCd1=&searchCommonCd2=&searchCondition2=all&searchKeyword=%EC%8B%A0%EC%9E%A5%EB%82%B4%EA%B3%BC&searchKeyword2=&userTab1=mediteam&empyId=&bbsId=bestPartner&nttSeq=",
  "심장내과": "https://seoul.hyumc.com/seoul/mediteam/mediofCent.do?action=detailList&returnAction=list&currentPageNo=1&recordCountPerPage=8&searchCondition1=all&searchCommonSeq=20&searchCommonCd1=&searchCommonCd2=&searchCondition2=all&searchKeyword=%EC%8B%AC%EC%9E%A5%EB%82%B4%EA%B3%BC&searchKeyword2=&userTab1=mediteam&empyId=&bbsId=bestPartner&nttSeq=",
  "외과": "https://seoul.hyumc.com/seoul/mediteam/mediofCent.do?action=detailList&returnAction=list&currentPageNo=1&recordCountPerPage=8&searchCondition1=all&searchCommonSeq=24&searchCommonCd1=&searchCommonCd2=&searchCondition2=all&searchKeyword=%EC%99%B8%EA%B3%BC&searchKeyword2=&userTab1=mediteam&empyId=&bbsId=bestPartner&nttSeq=",
  "안과": "https://seoul.hyumc.com/seoul/mediteam/mediofCent.do?action=detailList&returnAction=list&currentPageNo=1&recordCountPerPage=8&searchCondition1=all&searchCommonSeq=21&searchCommonCd1=&searchCommonCd2=&searchCondition2=all&searchKeyword=%EC%95%88%EA%B3%BC&searchKeyword2=&userTab1=mediteam&empyId=&bbsId=bestPartner&nttSeq=",
  "심창혈관흉부외과": "https://seoul.hyumc.com/seoul/mediteam/mediofCent.do?action=detailList&returnAction=list&currentPageNo=1&recordCountPerPage=8&searchCondition1=seqMediteam&searchCommonSeq=37&searchCommonCd1=&searchCommonCd2=&searchCondition2=all&searchKeyword=%EC%8B%AC%EC%9E%A5%ED%98%88%EA%B4%80%ED%9D%89%EB%B6%80%EC%99%B8%EA%B3%BC&searchKeyword2=&userTab1=mediteam&empyId=&bbsId=bestPartner&nttSeq=",
  "영상의학과": "https://seoul.hyumc.com/seoul/mediteam/mediofCent.do?action=detailList&returnAction=list&currentPageNo=1&recordCountPerPage=8&searchCondition1=seqMediteam&searchCommonSeq=23&searchCommonCd1=&searchCommonCd2=&searchCondition2=all&searchKeyword=%EC%98%81%EC%83%81%EC%9D%98%ED%95%99%EA%B3%BC&searchKeyword2=&userTab1=mediteam&empyId=&bbsId=bestPartner&nttSeq=",
};

// 류마티스병원 하위 과 목록 (서울 병원에서 "류마티스병원" 선택 시 노출)
export const RHEUMATOLOGY_DEPTS = [
  "골관절외과", "관절재활의학과", "류마티스내과", "류마티스안과",
  "류마티스영상의학과", "류마티스예방접종클리닉", "류마티스피부과", "통증의학과",
].sort((a, b) => a.localeCompare(b, "ko"));

// 구리 병원 진료과 (가나다순)
export const PROF_DEPTS_GURI = [
  "감염내과", "내과", "내분비대사내과", "류마티스내과", "마취통증의학과",
  "병리과", "비뇨의학과", "산부인과", "성형외과", "성형외과수부외과",
  "소아청소년과", "소화기내과", "신경과", "신경외과", "신장내과",
  "심장내과", "심장혈관흉부외과", "안과", "영상의학과", "외과",
  "외상외과", "응급의학과", "이비인후과", "재활의학과", "정신건강의학과",
  "정형외과", "정형외과수부외과", "직업환경의학과", "진단검사의학과",
  "진단검사의학과외래", "치과", "통증클리닉", "피부과", "핵의학과",
  "혈액종양내과", "호흡기내과",
].sort((a, b) => a.localeCompare(b, "ko"));

// 구리 병원 교수님 미리뵙기 링크
export const PROF_LINKS_GURI: Record<string, string> = {
  "감염내과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=38&searchHospCd=&searchKeyword=%EA%B0%90%EC%97%BC%EB%82%B4%EA%B3%BC",
  "외과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=55&searchHospCd=&searchKeyword=%EC%99%B8%EA%B3%BC",
  "병리과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=43&searchHospCd=&searchKeyword=%EB%B3%91%EB%A6%AC%EA%B3%BC",
  "소아청소년과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=47&searchHospCd=&searchKeyword=%EC%86%8C%EC%95%84%EC%B2%AD%EC%86%8C%EB%85%84%EA%B3%BC",
  "정신건강의학과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=59&searchHospCd=&searchKeyword=%EC%A0%95%EC%8B%A0%EA%B1%B4%EA%B0%95%EC%9D%98%ED%95%99%EA%B3%BC",
  "진단검사의학과외래": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=10018&searchHospCd=&searchKeyword=%EC%A7%84%EB%8B%A8%EA%B2%80%EC%82%AC%EC%9D%98%ED%95%99%EA%B3%BC%EC%99%B8%EB%9E%98",
  "심장내과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=52&searchHospCd=&searchKeyword=%EC%8B%AC%EC%9E%A5%EB%82%B4%EA%B3%BC",
  "외상외과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=10014&searchHospCd=&searchKeyword=%EC%99%B8%EC%83%81%EC%99%B8%EA%B3%BC",
  "정형외과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=60&searchHospCd=&searchKeyword=%EC%A0%95%ED%98%95%EC%99%B8%EA%B3%BC",
  "치과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=63&searchHospCd=&searchKeyword=%EC%B9%98%EA%B3%BC",
  "호흡기내과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=68&searchHospCd=&searchKeyword=%ED%98%B8%ED%9D%A1%EA%B8%B0%EB%82%B4%EA%B3%BC",
  "내과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=10034&searchHospCd=&searchKeyword=%EB%82%B4%EA%B3%BC",
  "비뇨의학과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=44&searchHospCd=&searchKeyword=%EB%B9%84%EB%87%A8%EC%9D%98%ED%95%99%EA%B3%BC",
  "소화기내과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=48&searchHospCd=&searchKeyword=%EC%86%8C%ED%99%94%EA%B8%B0%EB%82%B4%EA%B3%BC",
  "심장혈관흉부외과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=69&searchHospCd=&searchKeyword=%EC%8B%AC%EC%9E%A5%ED%98%88%EA%B4%80%ED%9D%89%EB%B6%80%EC%99%B8%EA%B3%BC",
  "응급의학과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=69&searchHospCd=&searchKeyword=%EC%8B%AC%EC%9E%A5%ED%98%88%EA%B4%80%ED%9D%89%EB%B6%80%EC%99%B8%EA%B3%BC",
  "정형외과수부외과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=10016&searchHospCd=&searchKeyword=%EC%A0%95%ED%98%95%EC%99%B8%EA%B3%BC%EC%88%98%EB%B6%80%EC%99%B8%EA%B3%BC",
  "통증클리닉": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=64&searchHospCd=&searchKeyword=%ED%86%B5%EC%A6%9D%ED%81%B4%EB%A6%AC%EB%8B%89",
  "내분비대사내과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=40&searchHospCd=&searchKeyword=%EB%82%B4%EB%B6%84%EB%B9%84%EB%8C%80%EC%82%AC%EB%82%B4%EA%B3%BC",
  "산부인과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=45&searchHospCd=&searchKeyword=%EC%82%B0%EB%B6%80%EC%9D%B8%EA%B3%BC",
  "신경과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=49&searchHospCd=&searchKeyword=%EC%8B%A0%EA%B2%BD%EA%B3%BC",
  "안과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=53&searchHospCd=&searchKeyword=%EC%95%88%EA%B3%BC",
  "이비인후과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=57&searchHospCd=&searchKeyword=%EC%9D%B4%EB%B9%84%EC%9D%B8%ED%9B%84%EA%B3%BC",
  "직업환경의학과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=61&searchHospCd=&searchKeyword=%EC%A7%81%EC%97%85%ED%99%98%EA%B2%BD%EC%9D%98%ED%95%99%EA%B3%BC",
  "피부과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=65&searchHospCd=&searchKeyword=%ED%94%BC%EB%B6%80%EA%B3%BC",
  "류마티스내과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=41&searchHospCd=&searchKeyword=%EB%A5%98%EB%A7%88%ED%8B%B0%EC%8A%A4%EB%82%B4%EA%B3%BC",
  "성형외과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=46&searchHospCd=&searchKeyword=%EC%84%B1%ED%98%95%EC%99%B8%EA%B3%BC",
  "신경외과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=50&searchHospCd=&searchKeyword=%EC%8B%A0%EA%B2%BD%EC%99%B8%EA%B3%BC",
  "영상의학과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=54&searchHospCd=&searchKeyword=%EC%98%81%EC%83%81%EC%9D%98%ED%95%99%EA%B3%BC",
  "재활의학과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=58&searchHospCd=&searchKeyword=%EC%9E%AC%ED%99%9C%EC%9D%98%ED%95%99%EA%B3%BC",
  "진단검사의학과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=62&searchHospCd=&searchKeyword=%EC%A7%84%EB%8B%A8%EA%B2%80%EC%82%AC%EC%9D%98%ED%95%99%EA%B3%BC",
  "핵의학과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=66&searchHospCd=&searchKeyword=%ED%95%B5%EC%9D%98%ED%95%99%EA%B3%BC",
  "마취통증의학과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=42&searchHospCd=&searchKeyword=%EB%A7%88%EC%B7%A8%ED%86%B5%EC%A6%9D%EC%9D%98%ED%95%99%EA%B3%BC",
  "성형외과수부외과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=10032&searchHospCd=&searchKeyword=%EC%84%B1%ED%98%95%EC%99%B8%EA%B3%BC%EC%88%98%EB%B6%80%EC%99%B8%EA%B3%BC",
  "신장내과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=51&searchHospCd=&searchKeyword=%EC%8B%A0%EC%9E%A5%EB%82%B4%EA%B3%BC",
  "혈액종양내과": "https://guri.hyumc.com/guri/mediteam/mditeam.do?action=detailList&searchCondition1=seqMediteam&searchCommonSeq=67&searchHospCd=&searchKeyword=%ED%98%88%EC%95%A1%EC%A2%85%EC%96%91%EB%82%B4%EA%B3%BC",
};
