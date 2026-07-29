package models

import (
	"time"
)

type Staff struct {
	ID                  string     `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	Name                string     `gorm:"column:name;type:varchar(191)" json:"name"`
	Email               *string    `gorm:"column:email;type:varchar(191);unique" json:"email"`
	Username            *string    `gorm:"column:username;type:varchar(191);unique" json:"username"`
	PasswordHash        *string    `gorm:"column:passwordHash;type:varchar(191)" json:"-"`
	Pin                 *string    `gorm:"column:pin;type:varchar(191)" json:"pin,omitempty"`
	Role                string     `gorm:"column:role;type:varchar(191);default:'staff'" json:"role"`
	Department          *string    `gorm:"column:department;type:varchar(191)" json:"department,omitempty"`
	Group               *string    `gorm:"column:group;type:varchar(191)" json:"group,omitempty"`
	PlatoonID           *string    `gorm:"column:platoonId;type:varchar(191)" json:"platoonId,omitempty"`
	Phone               *string    `gorm:"column:phone;type:varchar(191)" json:"phone,omitempty"`
	Gender              *string    `gorm:"column:gender;type:varchar(191)" json:"gender,omitempty"`
	Avatar              *string    `gorm:"column:avatar;type:varchar(191)" json:"avatar,omitempty"`
	Bio                 *string    `gorm:"column:bio;type:varchar(191)" json:"bio,omitempty"`
	Address             *string    `gorm:"column:address;type:varchar(191)" json:"address,omitempty"`
	EmergencyContact    *string    `gorm:"column:emergencyContact;type:varchar(191)" json:"emergencyContact,omitempty"`
	Status              string     `gorm:"column:status;type:varchar(191);default:'active'" json:"status"`
	ForcePasswordChange bool       `gorm:"column:forcePasswordChange;default:true" json:"forcePasswordChange"`
	FailedLoginAttempts int        `gorm:"column:failedLoginAttempts;default:0" json:"failedLoginAttempts"`
	LockedUntil         *time.Time `gorm:"column:lockedUntil" json:"lockedUntil,omitempty"`
	LastLoginAt         *time.Time `gorm:"column:lastLoginAt" json:"lastLoginAt,omitempty"`
	CreatedBy           *string    `gorm:"column:createdBy;type:varchar(191)" json:"createdBy,omitempty"`
	Tasks               *string    `gorm:"column:tasks;type:varchar(191)" json:"tasks,omitempty"`
	Availability        *string    `gorm:"column:availability;type:varchar(191)" json:"availability,omitempty"`
	CreatedAt           time.Time  `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
	UpdatedAt           time.Time  `gorm:"column:updatedAt" json:"updatedAt"`

	Platoon        *Platoon        `gorm:"foreignKey:PlatoonID" json:"platoon,omitempty"`
	RoleAssignment *RoleAssignment `gorm:"foreignKey:StaffID" json:"roleAssignment,omitempty"`
}

func (Staff) TableName() string { return "Staff" }

type Platoon struct {
	ID          string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	Name        string    `gorm:"column:name;type:varchar(191);unique" json:"name"`
	Emoji       string    `gorm:"column:emoji;type:varchar(191);default:'🏴'" json:"emoji"`
	Description *string   `gorm:"column:description;type:varchar(191)" json:"description,omitempty"`
	LeaderID    *string   `gorm:"column:leaderId;type:varchar(191)" json:"leaderId,omitempty"`
	ColorHex    *string   `gorm:"column:colorHex;type:varchar(191);default:'#1B7865'" json:"colorHex,omitempty"`
	Status      string    `gorm:"column:status;type:varchar(191);default:'active'" json:"status"`
	CreatedAt   time.Time `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updatedAt" json:"updatedAt"`

	Leader  *Staff   `gorm:"foreignKey:LeaderID" json:"leader,omitempty"`
	Staff   []Staff  `gorm:"foreignKey:PlatoonID" json:"staff,omitempty"`
	Campers []Camper `gorm:"foreignKey:PlatoonID" json:"campers,omitempty"`
}

func (Platoon) TableName() string { return "Platoon" }

type Dorm struct {
	ID                    string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	Name                  string    `gorm:"column:name;type:varchar(191);unique" json:"name"`
	Gender                string    `gorm:"column:gender;type:varchar(191)" json:"gender"`
	Capacity              int       `gorm:"column:capacity;default:50" json:"capacity"`
	Status                string    `gorm:"column:status;type:varchar(191);default:'active'" json:"status"`
	CreatedAt             time.Time `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
	UpdatedAt             time.Time `gorm:"column:updatedAt" json:"updatedAt"`
	SupervisorID          *string   `gorm:"column:supervisorId;type:varchar(191)" json:"supervisorId,omitempty"`
	AssistantSupervisorID *string   `gorm:"column:assistantSupervisorId;type:varchar(191)" json:"assistantSupervisorId,omitempty"`

	Supervisor          *Staff   `gorm:"foreignKey:SupervisorID" json:"supervisor,omitempty"`
	AssistantSupervisor *Staff   `gorm:"foreignKey:AssistantSupervisorID" json:"assistantSupervisor,omitempty"`
	Campers             []Camper `gorm:"foreignKey:DormID" json:"campers,omitempty"`
}

func (Dorm) TableName() string { return "Dorm" }

type Camper struct {
	ID                  string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	RegistrationNumber  *string   `gorm:"column:registrationNumber;type:varchar(191);unique" json:"registrationNumber,omitempty"`
	Name                string    `gorm:"column:name;type:varchar(191)" json:"name"`
	DateOfBirth         *string   `gorm:"column:dateOfBirth;type:varchar(191)" json:"dateOfBirth,omitempty"`
	Age                 *int      `gorm:"column:age" json:"age,omitempty"`
	Gender              *string   `gorm:"column:gender;type:varchar(191)" json:"gender,omitempty"`
	TShirtSize          *string   `gorm:"column:tshirtSize;type:varchar(191)" json:"tshirtSize,omitempty"`
	Photo               *string   `gorm:"column:photo;type:varchar(191)" json:"photo,omitempty"`
	PlatoonID           *string   `gorm:"column:platoonId;type:varchar(191)" json:"platoonId,omitempty"`
	DormID              *string   `gorm:"column:dormId;type:varchar(191)" json:"dormId,omitempty"`
	BedNumber           *string   `gorm:"column:bedNumber;type:varchar(191)" json:"bedNumber,omitempty"`
	DormNotes           *string   `gorm:"column:dormNotes;type:varchar(191)" json:"dormNotes,omitempty"`
	MedicalNotes        *string   `gorm:"column:medicalNotes;type:varchar(191)" json:"medicalNotes,omitempty"`
	Allergies           *string   `gorm:"column:allergies;type:varchar(191)" json:"allergies,omitempty"`
	Medications         *string   `gorm:"column:medications;type:varchar(191)" json:"medications,omitempty"`
	BloodGroup          *string   `gorm:"column:bloodGroup;type:varchar(191)" json:"bloodGroup,omitempty"`
	EmergencyContact    *string   `gorm:"column:emergencyContact;type:varchar(191)" json:"emergencyContact,omitempty"`
	GuardianName        *string   `gorm:"column:guardianName;type:varchar(191)" json:"guardianName,omitempty"`
	GuardianPhone       *string   `gorm:"column:guardianPhone;type:varchar(191)" json:"guardianPhone,omitempty"`
	GuardianEmail       *string   `gorm:"column:guardianEmail;type:varchar(191)" json:"guardianEmail,omitempty"`
	GuardianRelation    *string   `gorm:"column:guardianRelation;type:varchar(191)" json:"guardianRelation,omitempty"`
	Address             *string   `gorm:"column:address;type:varchar(191)" json:"address,omitempty"`
	Notes               *string   `gorm:"column:notes;type:varchar(191)" json:"notes,omitempty"`
	DietaryRestrictions *string   `gorm:"column:dietaryRestrictions;type:varchar(191)" json:"dietaryRestrictions,omitempty"`
	Church              *string   `gorm:"column:church;type:varchar(191)" json:"church,omitempty"`
	CounsellorID        *string   `gorm:"column:counsellorId;type:varchar(191)" json:"counsellorId,omitempty"`
	AgeGroup            *string   `gorm:"column:ageGroup;type:varchar(191)" json:"ageGroup,omitempty"`
	PickupCenter        *string   `gorm:"column:pickupCenter;type:varchar(191)" json:"pickupCenter,omitempty"`
	CreatedAt           time.Time `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
	UpdatedAt           time.Time `gorm:"column:updatedAt" json:"updatedAt"`

	Platoon    *Platoon `gorm:"foreignKey:PlatoonID" json:"platoon,omitempty"`
	Dorm       *Dorm    `gorm:"foreignKey:DormID" json:"dorm,omitempty"`
	Counsellor *Staff   `gorm:"foreignKey:CounsellorID;references:ID" json:"counsellor,omitempty"`
}

func (Camper) TableName() string { return "Camper" }

type Incident struct {
	ID              string     `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	Title           string     `gorm:"column:title;type:varchar(191)" json:"title"`
	Description     string     `gorm:"column:description;type:varchar(191)" json:"description"`
	Category        string     `gorm:"column:category;type:varchar(191);default:'other'" json:"category"`
	Severity        string     `gorm:"column:severity;type:varchar(191);default:'low'" json:"severity"`
	Status          string     `gorm:"column:status;type:varchar(191);default:'open'" json:"status"`
	CamperID        *string    `gorm:"column:camperId;type:varchar(191)" json:"camperId,omitempty"`
	AssignedStaffID *string    `gorm:"column:assignedStaffId;type:varchar(191)" json:"assignedStaffId,omitempty"`
	ReportedByID    *string    `gorm:"column:reportedById;type:varchar(191)" json:"reportedById,omitempty"`
	Location        *string    `gorm:"column:location;type:varchar(191)" json:"location,omitempty"`
	Resolution      *string    `gorm:"column:resolution;type:varchar(191)" json:"resolution,omitempty"`
	FollowUp        *string    `gorm:"column:followUp;type:varchar(191)" json:"followUp,omitempty"`
	ReportedAt      time.Time  `gorm:"column:reportedAt;default:current_timestamp(3)" json:"reportedAt"`
	ResolvedAt      *time.Time `gorm:"column:resolvedAt" json:"resolvedAt,omitempty"`
	UpdatedAt       time.Time  `gorm:"column:updatedAt" json:"updatedAt"`

	Camper        *Camper `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	AssignedStaff *Staff  `gorm:"foreignKey:AssignedStaffID" json:"assignedStaff,omitempty"`
	ReportedBy    *Staff  `gorm:"foreignKey:ReportedByID" json:"reportedBy,omitempty"`
}

func (Incident) TableName() string { return "Incident" }

type Announcement struct {
	ID          string     `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	Title       string     `gorm:"column:title;type:varchar(191)" json:"title"`
	Body        string     `gorm:"column:body;type:varchar(191)" json:"body"`
	Category    string     `gorm:"column:category;type:varchar(191);default:'General'" json:"category"`
	Priority    string     `gorm:"column:priority;type:varchar(191);default:'normal'" json:"priority"`
	Status      string     `gorm:"column:status;type:varchar(191);default:'published'" json:"status"`
	IsEmergency bool       `gorm:"column:isEmergency;default:false" json:"isEmergency"`
	Pinned      bool       `gorm:"column:pinned;default:false" json:"pinned"`
	TargetType  string     `gorm:"column:targetType;type:varchar(191);default:'all'" json:"targetType"`
	TargetID    *string    `gorm:"column:targetId;type:varchar(191)" json:"targetId,omitempty"`
	ScheduledAt *time.Time `gorm:"column:scheduledAt" json:"scheduledAt,omitempty"`
	ExpiryDate  *time.Time `gorm:"column:expiryDate" json:"expiryDate,omitempty"`
	AuthorID    *string    `gorm:"column:authorId;type:varchar(191)" json:"authorId,omitempty"`
	AuthorName  *string    `gorm:"column:authorName;type:varchar(191)" json:"authorName,omitempty"`
	CreatedAt   time.Time  `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
	UpdatedAt   time.Time  `gorm:"column:updatedAt" json:"updatedAt"`
}

func (Announcement) TableName() string { return "Announcement" }

type AnnouncementRead struct {
	ID             string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	AnnouncementID string    `gorm:"column:announcementId;type:varchar(191)" json:"announcementId"`
	UserID         string    `gorm:"column:userId;type:varchar(191)" json:"userId"`
	ReadAt         time.Time `gorm:"column:readAt;default:current_timestamp(3)" json:"readAt"`
}

func (AnnouncementRead) TableName() string { return "AnnouncementRead" }

type CampSettings struct {
	ID        string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	Key       string    `gorm:"column:key;type:varchar(191);unique" json:"key"`
	Value     string    `gorm:"column:value;type:varchar(191)" json:"value"`
	UpdatedAt time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}

func (CampSettings) TableName() string { return "CampSettings" }

type Role struct {
	ID          string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	Name        string    `gorm:"column:name;type:varchar(191);unique" json:"name"`
	Description *string   `gorm:"column:description;type:varchar(191)" json:"description,omitempty"`
	Permissions string    `gorm:"column:permissions;type:varchar(191);default:'[]'" json:"permissions"`
	IsSystem    bool      `gorm:"column:isSystem;default:false" json:"isSystem"`
	CreatedAt   time.Time `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}

func (Role) TableName() string { return "Role" }

type RoleAssignment struct {
	ID        string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	StaffID   string    `gorm:"column:staffId;type:varchar(191);unique" json:"staffId"`
	RoleID    string    `gorm:"column:roleId;type:varchar(191)" json:"roleId"`
	CreatedAt time.Time `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`

	Role *Role `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}

func (RoleAssignment) TableName() string { return "RoleAssignment" }

type AuditLog struct {
	ID         string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	UserID     string    `gorm:"column:userId;type:varchar(191)" json:"userId"`
	UserName   string    `gorm:"column:userName;type:varchar(191)" json:"userName"`
	Action     string    `gorm:"column:action;type:varchar(191)" json:"action"`
	TargetType *string   `gorm:"column:targetType;type:varchar(191)" json:"targetType,omitempty"`
	TargetID   *string   `gorm:"column:targetId;type:varchar(191)" json:"targetId,omitempty"`
	TargetName *string   `gorm:"column:targetName;type:varchar(191)" json:"targetName,omitempty"`
	Detail     *string   `gorm:"column:detail;type:varchar(191)" json:"detail,omitempty"`
	IPAddress  *string   `gorm:"column:ipAddress;type:varchar(191)" json:"ipAddress,omitempty"`
	CreatedAt  time.Time `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
}

func (AuditLog) TableName() string { return "AuditLog" }

type Notification struct {
	ID        string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	UserID    string    `gorm:"column:userId;type:varchar(191)" json:"userId"`
	Title     string    `gorm:"column:title;type:varchar(191)" json:"title"`
	Message   string    `gorm:"column:message;type:varchar(191)" json:"message"`
	Type      string    `gorm:"column:type;type:varchar(191);default:'info'" json:"type"`
	Category  string    `gorm:"column:category;type:varchar(191);default:'General'" json:"category"`
	Priority  string    `gorm:"column:priority;type:varchar(191);default:'normal'" json:"priority"`
	IsRead    bool      `gorm:"column:isRead;default:false" json:"isRead"`
	Link      *string   `gorm:"column:link;type:varchar(191)" json:"link,omitempty"`
	CreatedAt time.Time `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
}

func (Notification) TableName() string { return "Notification" }

type PasswordResetToken struct {
	ID        string     `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	UserID    string     `gorm:"column:userId;type:varchar(191)" json:"userId"`
	Token     string     `gorm:"column:token;type:varchar(191);unique" json:"token"`
	ExpiresAt time.Time  `gorm:"column:expiresAt" json:"expiresAt"`
	UsedAt    *time.Time `gorm:"column:usedAt" json:"usedAt,omitempty"`
	CreatedAt time.Time  `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
}

func (PasswordResetToken) TableName() string { return "PasswordResetToken" }

type CampDrill struct {
	ID                string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	Name              string    `gorm:"column:name;type:varchar(191)" json:"name"`
	Category          string    `gorm:"column:category;type:varchar(191);default:'General'" json:"category"`
	Description       *string   `gorm:"column:description;type:varchar(191)" json:"description,omitempty"`
	AssignedStaffID   *string   `gorm:"column:assignedStaffId;type:varchar(191)" json:"assignedStaffId,omitempty"`
	BackupStaffID     *string   `gorm:"column:backupStaffId;type:varchar(191)" json:"backupStaffId,omitempty"`
	SessionID         *string   `gorm:"column:sessionId;type:varchar(191)" json:"sessionId,omitempty"`
	PlatoonID         *string   `gorm:"column:platoonId;type:varchar(191)" json:"platoonId,omitempty"`
	Department        *string   `gorm:"column:department;type:varchar(191)" json:"department,omitempty"`
	Date              *string   `gorm:"column:date;type:varchar(191)" json:"date,omitempty"`
	StartTime         *string   `gorm:"column:startTime;type:varchar(191)" json:"startTime,omitempty"`
	EndTime           *string   `gorm:"column:endTime;type:varchar(191)" json:"endTime,omitempty"`
	Venue             *string   `gorm:"column:venue;type:varchar(191)" json:"venue,omitempty"`
	Priority          string    `gorm:"column:priority;type:varchar(191);default:'medium'" json:"priority"`
	Status            string    `gorm:"column:status;type:varchar(191);default:'upcoming'" json:"status"`
	Instructions      *string   `gorm:"column:instructions;type:varchar(191)" json:"instructions,omitempty"`
	RequiredEquipment *string   `gorm:"column:requiredEquipment;type:varchar(191)" json:"requiredEquipment,omitempty"`
	Notes             *string   `gorm:"column:notes;type:varchar(191)" json:"notes,omitempty"`
	CompletionNotes   *string   `gorm:"column:completionNotes;type:varchar(191)" json:"completionNotes,omitempty"`
	CreatedAt         time.Time `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
	UpdatedAt         time.Time `gorm:"column:updatedAt" json:"updatedAt"`

	AssignedStaff *Staff               `gorm:"foreignKey:AssignedStaffID" json:"assignedStaff,omitempty"`
	BackupStaff   *Staff               `gorm:"foreignKey:BackupStaffID" json:"backupStaff,omitempty"`
	Platoon       *Platoon             `gorm:"foreignKey:PlatoonID" json:"platoon,omitempty"`
	Checklist     []DrillChecklistItem `gorm:"foreignKey:DrillID" json:"checklist,omitempty"`
}

func (CampDrill) TableName() string { return "CampDrill" }

type DrillChecklistItem struct {
	ID          string     `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	DrillID     string     `gorm:"column:drillId;type:varchar(191)" json:"drillId"`
	Text        string     `gorm:"column:text;type:varchar(191)" json:"text"`
	IsCompleted bool       `gorm:"column:isCompleted;default:false" json:"isCompleted"`
	CompletedAt *time.Time `gorm:"column:completedAt" json:"completedAt,omitempty"`
}

func (DrillChecklistItem) TableName() string { return "DrillChecklistItem" }

type AttendanceRecord struct {
	ID           string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	SessionID    string    `gorm:"column:sessionId;type:varchar(191)" json:"sessionId"`
	CamperID     *string   `gorm:"column:camperId;type:varchar(191)" json:"camperId,omitempty"`
	StaffID      *string   `gorm:"column:staffId;type:varchar(191)" json:"staffId,omitempty"`
	Status       string    `gorm:"column:status;type:varchar(191)" json:"status"`
	Timestamp    time.Time `gorm:"column:timestamp;default:current_timestamp(3)" json:"timestamp"`
	RecordedByID *string   `gorm:"column:recordedById;type:varchar(191)" json:"recordedById,omitempty"`
	Notes        *string   `gorm:"column:notes;type:varchar(191)" json:"notes,omitempty"`
	CreatedAt    time.Time `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updatedAt" json:"updatedAt"`

	Camper     *Camper `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	Staff      *Staff  `gorm:"foreignKey:StaffID" json:"staff,omitempty"`
	RecordedBy *Staff  `gorm:"foreignKey:RecordedByID" json:"recordedBy,omitempty"`
}

func (AttendanceRecord) TableName() string { return "AttendanceRecord" }

type ProgramSession struct {
	ID                 string    `gorm:"primaryKey;column:id;type:varchar(191)" json:"id"`
	Day                string    `gorm:"column:day;type:varchar(191)" json:"day"`
	Key                string    `gorm:"column:key;type:varchar(191)" json:"key"`
	Title              string    `gorm:"column:title;type:varchar(191)" json:"title"`
	Time               string    `gorm:"column:time;type:varchar(191)" json:"time"`
	End                string    `gorm:"column:end;type:varchar(191)" json:"end"`
	Location           *string   `gorm:"column:location;type:varchar(191)" json:"location,omitempty"`
	Type               *string   `gorm:"column:type;type:varchar(191)" json:"type,omitempty"`
	Groups             *string   `gorm:"column:groups;type:varchar(191);default:'all'" json:"groups,omitempty"`
	Speaker            *string   `gorm:"column:speaker;type:varchar(191)" json:"speaker,omitempty"`
	Description        *string   `gorm:"column:description;type:varchar(191)" json:"description,omitempty"`
	RequiresAttendance bool      `gorm:"column:requiresAttendance;default:false" json:"requiresAttendance"`
	CreatedAt          time.Time `gorm:"column:createdAt;default:current_timestamp(3)" json:"createdAt"`
	UpdatedAt          time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}

func (ProgramSession) TableName() string { return "ProgramSession" }


