from cian_parser.models import InformationFromAds


def find_all_unique_phone():
    all_obj = InformationFromAds.objects.all()
    phones = []
    for i in all_obj:
        if i.phone in phones:
            pass
        if i.phone not in phones:
            phones.append(i.phone)
    return phones


# def rieltor_reports(phones):
